import { useEffect, useMemo, useState } from "react";
import { Banknote, Clock, Radio, RefreshCw, Wallet } from "lucide-react";
import { PageHeader, FilterBar, FilterField } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { Pagination } from "../components/ui/Pagination";
import { StatusBadge } from "../components/ui/Badge";
import { AwadocDetailModal } from "../components/awadoc/AwadocDetailModal";
import { AwadocMetricCard } from "../components/awadoc/AwadocMetricCard";
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

const LIST_VIEW_OPTIONS = [
  { value: "confirmed", label: "Confirmed bookings" },
  { value: "awaiting", label: "Awaiting confirmation" },
  { value: "all", label: "All requests" },
];

const FLOW_LABELS = {
  GP_CMO: "GP (CMO)",
  SPECIALIST_SLOT: "Specialist slot",
  CMO: "CMO / own time",
};

const APPOINTMENT_OPTIONS = [
  { value: "all", label: "Any appointment date" },
  { value: "today", label: "Appointment today" },
  { value: "tomorrow", label: "Appointment tomorrow" },
  { value: "week", label: "Appointment this week" },
  { value: "month", label: "Appointment this month" },
  { value: "year", label: "Appointment this year" },
];

const PERIOD_LABELS = {
  today: "today",
  tomorrow: "tomorrow",
  week: "this week",
  month: "this month",
  year: "this year",
};

function pickConfirmed(summary, period) {
  if (!summary) return { total: 0, gp: 0, specialists: 0 };
  switch (period) {
    case "today":
      return {
        total: summary.confirmedToday ?? 0,
        gp: summary.confirmedTodayGp ?? 0,
        specialists: summary.confirmedTodaySpecialists ?? 0,
      };
    case "week":
      return {
        total: summary.confirmedThisWeek ?? 0,
        gp: summary.confirmedThisWeekGp ?? 0,
        specialists: summary.confirmedThisWeekSpecialists ?? 0,
      };
    case "year":
      return {
        total: summary.confirmedThisYear ?? 0,
        gp: summary.confirmedThisYearGp ?? 0,
        specialists: summary.confirmedThisYearSpecialists ?? 0,
      };
    default:
      return {
        total: summary.confirmedThisMonth ?? 0,
        gp: summary.confirmedThisMonthGp ?? 0,
        specialists: summary.confirmedThisMonthSpecialists ?? 0,
      };
  }
}

function pickEarnings(summary, period) {
  if (!summary) return { total: 0, doctor: 0 };
  switch (period) {
    case "today":
      return {
        total: summary.earningsToday ?? 0,
        doctor: summary.doctorEarningsToday ?? 0,
      };
    case "week":
      return {
        total: summary.earningsThisWeek ?? 0,
        doctor: summary.doctorEarningsThisWeek ?? 0,
      };
    case "year":
      return {
        total: summary.earningsThisYear ?? 0,
        doctor: summary.doctorEarningsThisYear ?? 0,
      };
    default:
      return {
        total: summary.earningsThisMonth ?? 0,
        doctor: summary.doctorEarningsThisMonth ?? 0,
      };
  }
}

function pickTotalPrice(summary, period) {
  if (!summary) return 0;
  switch (period) {
    case "today":
      return summary.totalPriceToday ?? 0;
    case "week":
      return summary.totalPriceThisWeek ?? 0;
    case "year":
      return summary.totalPriceThisYear ?? 0;
    default:
      return summary.totalPriceThisMonth ?? 0;
  }
}

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
  const [bookingPeriod, setBookingPeriod] = useState("month");
  const [earningsPeriod, setEarningsPeriod] = useState("month");
  const [pricePeriod, setPricePeriod] = useState("month");
  const [listView, setListView] = useState("confirmed");
  const [typeFilter, setTypeFilter] = useState("all");
  const [specialtyFilter, setSpecialtyFilter] = useState("all");
  const [outboundFilter, setOutboundFilter] = useState("all");
  const [flowFilter, setFlowFilter] = useState("all");
  const [appointmentFilter, setAppointmentFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [retryingId, setRetryingId] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const confirmedStats = useMemo(
    () => pickConfirmed(summary, bookingPeriod),
    [summary, bookingPeriod]
  );
  const earningsStats = useMemo(
    () => pickEarnings(summary, earningsPeriod),
    [summary, earningsPeriod]
  );
  const totalPrice = useMemo(() => pickTotalPrice(summary, pricePeriod), [summary, pricePeriod]);

  useEffect(() => {
    setPage(1);
  }, [typeFilter, specialtyFilter, listView, bookingPeriod, outboundFilter, flowFilter, appointmentFilter, search]);

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
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError("");
      try {
        const outboundActive = outboundFilter !== "all";
        const params = {
          type: typeFilter !== "all" ? typeFilter : undefined,
          specialization: specialtyFilter !== "all" ? specialtyFilter : undefined,
          outboundStatus: outboundActive ? outboundFilter : undefined,
          flowType: flowFilter !== "all" ? flowFilter : undefined,
          search: search || undefined,
          page,
          pageSize: PAGE_SIZE,
        };

        if (appointmentFilter !== "all") {
          params.appointmentPeriod = appointmentFilter;
        }

        if (!outboundActive) {
          if (listView === "confirmed") {
            params.confirmed = true;
            params.confirmedPeriod = bookingPeriod;
          } else if (listView === "awaiting") {
            params.confirmed = false;
          }
        }

        const result = await api.getAwadocConsultations(params);
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
  }, [
    typeFilter,
    specialtyFilter,
    listView,
    bookingPeriod,
    outboundFilter,
    flowFilter,
    appointmentFilter,
    search,
    page,
  ]);

  const refreshRow = async (row) => {
    if (!row?.id) return row;
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
      api.getAwadocSummary().then(setSummary).catch(() => {});
    } catch (err) {
      setError(err.message || "Retry failed");
    } finally {
      setRetryingId(null);
    }
  };

  const openDetail = async (row) => {
    if (!row?.id) return;
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
      wrap: true,
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

  const listDescription = useMemo(() => {
    const appointmentLabel =
      appointmentFilter !== "all"
        ? `appointment ${PERIOD_LABELS[appointmentFilter] || appointmentFilter}`
        : null;
    if (outboundFilter !== "all") {
      return appointmentLabel
        ? `outbound ${outboundFilter.toLowerCase()} · ${appointmentLabel}`
        : `outbound status ${outboundFilter.toLowerCase()}`;
    }
    if (listView === "awaiting") {
      return appointmentLabel ? `awaiting confirmation · ${appointmentLabel}` : "awaiting confirmation";
    }
    if (listView === "all") {
      return appointmentLabel ? `all requests · ${appointmentLabel}` : "all requests";
    }
    const confirmedLabel = `confirmed bookings for ${PERIOD_LABELS[bookingPeriod] || bookingPeriod}`;
    return appointmentLabel ? `${confirmedLabel} · ${appointmentLabel}` : confirmedLabel;
  }, [outboundFilter, listView, bookingPeriod, appointmentFilter]);

  return (
    <div>
      <PageHeader
        title="Awadoc"
        description="Track confirmed Awadoc bookings, awaiting payments, outbound retries, and earnings."
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

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AwadocMetricCard
          title="Confirmed bookings"
          description="Paid and linked in our system"
          value={confirmedStats.total}
          subtitle={`GP ${confirmedStats.gp} · Specialists ${confirmedStats.specialists}`}
          icon={Radio}
          showPeriod
          period={bookingPeriod}
          onPeriodChange={(p) => {
            setBookingPeriod(p);
            setListView("confirmed");
            setOutboundFilter("all");
          }}
          loading={summaryLoading}
        />
        <button
          type="button"
          className="text-left"
          onClick={() => {
            setListView("awaiting");
            setOutboundFilter("all");
          }}
        >
          <AwadocMetricCard
            title="Awaiting confirmation"
            description="Request received, payment not confirmed yet"
            value={summaryLoading ? "…" : summary?.awaitingConfirmation ?? 0}
            icon={Clock}
            accent="amber"
            loading={summaryLoading}
          />
        </button>
        <AwadocMetricCard
          title="Earnings"
          description="Settled Awadoc consultation revenue"
          value={formatNaira(earningsStats.total)}
          subtitle={`Doctor share ${formatNaira(earningsStats.doctor)}`}
          icon={Wallet}
          accent="green"
          showPeriod
          period={earningsPeriod}
          onPeriodChange={setEarningsPeriod}
          loading={summaryLoading}
        />
        <AwadocMetricCard
          title="Total booking value"
          description="Sum of confirmed consultation prices (₦)"
          value={formatNaira(totalPrice)}
          subtitle="Listed price at booking — not settled earnings"
          icon={Banknote}
          accent="green"
          showPeriod
          period={pricePeriod}
          onPeriodChange={setPricePeriod}
          loading={summaryLoading}
        />
        <button
          type="button"
          className="text-left"
          onClick={() => {
            setOutboundFilter("PENDING");
            setListView("all");
          }}
        >
          <AwadocMetricCard
            title="Pending retries"
            description="doctor_assigned callbacks queued to retry"
            value={summaryLoading ? "…" : summary?.pendingOutboundRetries ?? 0}
            icon={RefreshCw}
            accent="amber"
            loading={summaryLoading}
          />
        </button>
        <button
          type="button"
          className="text-left"
          onClick={() => {
            setOutboundFilter("EXHAUSTED");
            setListView("all");
          }}
        >
          <AwadocMetricCard
            title="Exhausted outbound"
            description="All automatic retries failed — use Retry in the table"
            value={summaryLoading ? "…" : summary?.exhaustedOutbound ?? 0}
            icon={RefreshCw}
            accent="rose"
            loading={summaryLoading}
          />
        </button>
      </div>

      <FilterBar>
        <FilterField label="Show">
          <select
            className="input-field"
            value={listView}
            onChange={(e) => {
              setListView(e.target.value);
              if (e.target.value === "confirmed") setOutboundFilter("all");
            }}
          >
            {LIST_VIEW_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FilterField>
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
        <FilterField label="Flow">
          <select className="input-field" value={flowFilter} onChange={(e) => setFlowFilter(e.target.value)}>
            <option value="all">All flows</option>
            <option value="GP_CMO">GP (CMO)</option>
            <option value="SPECIALIST_SLOT">Specialist slot</option>
            <option value="CMO">CMO / own time</option>
          </select>
        </FilterField>
        <FilterField label="Appointment">
          <select
            className="input-field"
            value={appointmentFilter}
            onChange={(e) => setAppointmentFilter(e.target.value)}
          >
            {APPOINTMENT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
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
        {loading ? "Loading..." : `${total} row(s) · ${listDescription}`}
      </p>

      <DataTable
        columns={columns}
        data={rows}
        onRowClick={(row) => openDetail(row)}
        minWidth="1200px"
        emptyMessage={`No Awadoc consultations for ${listDescription}.`}
      />

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
