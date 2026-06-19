import { useEffect, useMemo, useState } from "react";
import { PageHeader, FilterBar, FilterField } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { Pagination } from "../components/ui/Pagination";
import { StatusBadge } from "../components/ui/Badge";
import { buildMonthOptions, formatDate, formatMonthLabel, getMonthDateRange } from "../utils/format";
import { api } from "../api/client";
import { useOrganizations } from "../context/OrganizationsContext";

const PAGE_SIZE = 20;
const MONTH_OPTIONS = buildMonthOptions(24);

export default function ConsultationsPage() {
  const { organizations } = useOrganizations();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");

  const monthRange = useMemo(() => getMonthDateRange(monthFilter), [monthFilter]);

  const selectedOrgName = useMemo(() => {
    if (orgFilter === "all") return null;
    if (orgFilter === "none") return "No organization";
    return organizations.find((o) => String(o.id) === orgFilter)?.name || null;
  }, [orgFilter, organizations]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter, orgFilter, monthFilter]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const result = await api.getConsultations({
          status: statusFilter !== "all" ? statusFilter : undefined,
          type: typeFilter !== "all" ? typeFilter : undefined,
          organizationId:
            orgFilter === "all" ? undefined : orgFilter === "none" ? 0 : Number(orgFilter),
          from: monthRange.from,
          to: monthRange.to,
          page,
          pageSize: PAGE_SIZE,
        });
        if (cancelled) return;
        setRows(result.items || []);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 0);
      } catch {
        if (!cancelled) {
          setRows([]);
          setTotal(0);
          setTotalPages(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [statusFilter, typeFilter, orgFilter, monthFilter, monthRange, page]);

  const columns = [
    { key: "patientName", label: "Patient" },
    { key: "doctorName", label: "Doctor" },
    { key: "type", label: "Type" },
    { key: "date", label: "Date", render: (r) => formatDate(r.date) },
    { key: "time", label: "Time" },
    { key: "organization", label: "Organization", render: (r) => r.organization || "—" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  const summaryParts = [];
  if (selectedOrgName) summaryParts.push(selectedOrgName);
  if (monthFilter !== "all") summaryParts.push(formatMonthLabel(monthFilter));
  if (statusFilter !== "all") summaryParts.push(statusFilter);

  return (
    <div>
      <PageHeader
        title="Consultations"
        description="Review consultations by organization and billing period for month-end reconciliation."
      />
      <FilterBar>
        <FilterField label="Organization">
          <select className="input-field" value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}>
            <option value="all">All organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
            <option value="none">No organization</option>
          </select>
        </FilterField>
        <FilterField label="Month">
          <select className="input-field" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
            {MONTH_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Status">
          <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </FilterField>
        <FilterField label="Type">
          <select className="input-field" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Instant">Instant Video</option>
          </select>
        </FilterField>
      </FilterBar>

      {summaryParts.length > 0 && !loading && (
        <div className="mb-4 rounded-xl border border-medfair/20 bg-medfair/5 px-4 py-3 text-sm text-slate-700">
          <span className="font-semibold text-medfair">{total.toLocaleString()}</span>
          {" consultation(s)"}
          {summaryParts.length ? ` for ${summaryParts.join(" · ")}` : ""}
        </div>
      )}

      <p className="mb-3 text-sm text-slate-500">
        {loading ? "Loading..." : `${total.toLocaleString()} consultation(s)`}
      </p>
      <DataTable columns={columns} data={rows} />
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        loading={loading}
        onPageChange={setPage}
      />
    </div>
  );
}
