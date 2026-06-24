import { useEffect, useState } from "react";
import { Radio, RefreshCw } from "lucide-react";
import { PageHeader, FilterBar, FilterField } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { Pagination } from "../components/ui/Pagination";
import { StatCard } from "../components/ui/StatCard";
import { StatusBadge } from "../components/ui/Badge";
import { AwadocDetailModal } from "../components/awadoc/AwadocDetailModal";
import { formatDateTime, formatNaira } from "../utils/format";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { STAFF_ROLES } from "../constants/roles";

const PAGE_SIZE = 20;

const SPECIALTY_OPTIONS = [
  { value: "all", label: "All specialties" },
  { value: "GENERAL_PRACTITIONER", label: "General Practitioner" },
  { value: "MENTAL_HEALTH_SPECIALIST", label: "Mental Health" },
  { value: "CLINICAL_PSYCHOLOGIST", label: "Clinical Psychologist" },
  { value: "UROLOGIST", label: "Urologist" },
  { value: "EAR_NOSE_THROAT_SPECIALIST", label: "ENT" },
];

const FLOW_LABELS = {
  GP_CMO: "GP (CMO)",
  SPECIALIST_SLOT: "Specialist slot",
  CMO: "CMO / own time",
};

export default function AwadocPage() {
  const { user } = useAuth();
  const canRetry = [
    STAFF_ROLES.SUPER_ADMIN,
    STAFF_ROLES.CLINICAL_OPS,
    STAFF_ROLES.OPERATIONS,
    STAFF_ROLES.TECHNICAL,
  ].includes(user?.role);

  const [summary, setSummary] = useState(null);
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [confirmedFilter, setConfirmedFilter] = useState("true");
  const [outboundFilter, setOutboundFilter] = useState("all");
  const [flowFilter, setFlowFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [retryingId, setRetryingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setPage(1);
  }, [typeFilter, specialtyFilter, confirmedFilter, outboundFilter, flowFilter, search]);

  useEffect(() => {
    let cancelled = false;
    setSummaryLoading(true);
    api
      .getAwadocSummary()
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      })
      .finally(() => {
        if (!cancelled) setSummaryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [rows]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const result = await api.getAwadocConsultations({
          type: typeFilter !== "all" ? typeFilter : undefined,
          specialization: specialtyFilter !== "all" ? specialtyFilter : undefined,
          confirmed:
            confirmedFilter === "all" ? undefined : confirmedFilter === "true",
          outboundStatus: outboundFilter !== "all" ? outboundFilter : undefined,
          flowType: flowFilter !== "all" ? flowFilter : undefined,
          search: search || undefined,
          page,
          pageSize: PAGE_SIZE,
        });
        if (cancelled) return;
        setRows(result.items || []);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 0);
      } catch (err) {
        if (!cancelled) {
          setRows([]);
          setTotal(0);
          setTotalPages(0);
          setError(err.message || "Failed to load Awadoc consultations");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [typeFilter, specialtyFilter, confirmedFilter, outboundFilter, flowFilter, search, page]);

  const refreshRow = async (row) => {
    try {
      const detail = await api.getAwadocConsultation(row.id);
      setRows((prev) => prev.map((r) => (r.id === detail.id ? detail : r)));
      if (selected?.id === detail.id) setSelected(detail);
      return detail;
    } catch {
      return row;
    }
  };

  const handleRetry = async (row) => {
    if (!row.outboundWebhookId || !canRetry) return;
    setRetryingId(row.outboundWebhookId);
    setError("");
    setMessage("");
    try {
      await api.retryPartnerOutboundWebhook(row.outboundWebhookId);
      const updated = await refreshRow(row);
      setMessage(`Retry queued for request ${updated.requestId || row.requestId}.`);
      setTimeout(() => setMessage(""), 5000);
    } catch (err) {
      setError(err.message || "Retry failed");
    } finally {
      setRetryingId(null);
    }
  };

  const openDetail = async (row) => {
    setSelected(row);
    setDetailOpen(true);
    try {
      const detail = await api.getAwadocConsultation(row.id);
      setSelected(detail);
      setRows((prev) => prev.map((r) => (r.id === detail.id ? detail : r)));
    } catch {
      // keep list row data
    }
  };

  const columns = [
    {
      key: "requestId",
      label: "Request ID",
      render: (r) => (
        <span className="font-mono text-xs text-slate-700">{r.requestId || "—"}</span>
      ),
    },
    {
      key: "specializationLabel",
      label: "Specialty",
      render: (r) => r.specializationLabel || r.specialization || "—",
    },
    {
      key: "flowType",
      label: "Flow",
      render: (r) => FLOW_LABELS[r.flowType] || r.flowType || "—",
    },
    {
      key: "doctorName",
      label: "Doctor / assignee",
      render: (r) => r.doctorName || "—",
    },
    {
      key: "appointmentTime",
      label: "Appointment",
      render: (r) => formatDateTime(r.appointmentTime || r.preferredTime),
    },
    {
      key: "confirmedAt",
      label: "Confirmed",
      render: (r) => (r.confirmedAt ? formatDateTime(r.confirmedAt) : "Awaiting payment"),
    },
    {
      key: "priceNgn",
      label: "Price",
      render: (r) => (r.priceNgn != null ? formatNaira(r.priceNgn) : "—"),
    },
    {
      key: "outboundStatus",
      label: "Outbound",
      render: (r) =>
        r.outboundStatus ? <StatusBadge status={r.outboundStatus} /> : <span className="text-slate-400">—</span>,
    },
    {
      key: "retry",
      label: "",
      render: (r) =>
        canRetry &&
        r.outboundWebhookId &&
        (r.outboundStatus === "PENDING" || r.outboundStatus === "EXHAUSTED") ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleRetry(r);
            }}
            className="text-sm font-medium text-medfair hover:underline"
            disabled={retryingId === r.outboundWebhookId}
          >
            {retryingId === r.outboundWebhookId ? "Retrying..." : "Retry"}
          </button>
        ) : null,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Awadoc"
        description="Confirmed Awadoc appointments for GP and specialists. Retry failed doctor_assigned callbacks from here."
      />

      {message && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Confirmed today"
          value={summaryLoading ? "…" : summary?.confirmedToday ?? 0}
          subtitle={`GP ${summary?.confirmedTodayGp ?? 0} · Specialists ${summary?.confirmedTodaySpecialists ?? 0}`}
          icon={Radio}
        />
        <StatCard
          title="Awaiting confirmation"
          value={summaryLoading ? "…" : summary?.awaitingConfirmation ?? 0}
          accent="amber"
        />
        <StatCard
          title="Pending retries"
          value={summaryLoading ? "…" : summary?.pendingOutboundRetries ?? 0}
          accent="amber"
          icon={RefreshCw}
        />
        <StatCard
          title="Exhausted outbound"
          value={summaryLoading ? "…" : summary?.exhaustedOutbound ?? 0}
          accent="rose"
        />
      </div>

      <FilterBar>
        <FilterField label="Search">
          <input
            className="input-field"
            placeholder="Request ID, consultation ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </FilterField>
        <FilterField label="Type">
          <select className="input-field" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">GP + specialists</option>
            <option value="gp">GP only</option>
            <option value="specialist">Specialists only</option>
          </select>
        </FilterField>
        <FilterField label="Specialty">
          <select className="input-field" value={specialtyFilter} onChange={(e) => setSpecialtyFilter(e.target.value)}>
            {SPECIALTY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Payment status">
          <select
            className="input-field"
            value={confirmedFilter}
            onChange={(e) => setConfirmedFilter(e.target.value)}
          >
            <option value="true">Confirmed (paid)</option>
            <option value="false">Awaiting confirmation</option>
            <option value="all">All</option>
          </select>
        </FilterField>
        <FilterField label="Flow">
          <select className="input-field" value={flowFilter} onChange={(e) => setFlowFilter(e.target.value)}>
            <option value="all">All flows</option>
            <option value="GP_CMO">GP (CMO)</option>
            <option value="SPECIALIST_SLOT">Specialist slot</option>
            <option value="CMO">CMO / own time</option>
          </select>
        </FilterField>
        <FilterField label="Outbound status">
          <select className="input-field" value={outboundFilter} onChange={(e) => setOutboundFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="SUCCESS">Success</option>
            <option value="PENDING">Pending retry</option>
            <option value="EXHAUSTED">Exhausted</option>
            <option value="none">Not sent</option>
          </select>
        </FilterField>
      </FilterBar>

      <p className="mb-3 text-sm text-slate-500">
        {loading ? "Loading..." : `${total} consultation(s)`}
      </p>

      <DataTable columns={columns} data={rows} onRowClick={openDetail} />

      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <AwadocDetailModal
        item={selected}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        onRetry={handleRetry}
        retrying={retryingId === selected?.outboundWebhookId}
      />
    </div>
  );
}
