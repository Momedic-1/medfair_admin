import { useEffect, useMemo, useState } from "react";
import { PageHeader, FilterBar, FilterField } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { Pagination } from "../components/ui/Pagination";
import { StatusBadge } from "../components/ui/Badge";
import { formatDate, formatNaira } from "../utils/format";
import { api } from "../api/client";

const PAGE_SIZE = 20;

export default function SubscriptionsPage() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setPage(1);
  }, [search, planFilter, statusFilter]);

  useEffect(() => {
    setLoading(true);
    api.getSubscriptions({
      search: search || undefined,
      plan: planFilter !== "all" ? planFilter : undefined,
      status: statusFilter !== "all" ? statusFilter : undefined,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((result) => {
        setRows(result.items || []);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 0);
      })
      .catch(() => {
        setRows([]);
        setTotal(0);
        setTotalPages(0);
      })
      .finally(() => setLoading(false));
  }, [search, planFilter, statusFilter, page]);

  const activeCount = useMemo(() => rows.filter((r) => r.status === "active").length, [rows]);

  const columns = [
    { key: "userName", label: "User" },
    { key: "plan", label: "Plan" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status || "expired"} /> },
    { key: "expirationDate", label: "Expires", render: (r) => formatDate(r.expirationDate) },
    { key: "consultationsRemaining", label: "Consultations left" },
    { key: "organization", label: "Organization", render: (r) => r.organization || "—" },
    { key: "amountPaid", label: "Amount paid", render: (r) => formatNaira(Number(r.amountPaid)) },
  ];

  return (
    <div>
      <PageHeader
        title="Subscriptions"
        description="All subscription records. The dashboard only counts active (non-expired) subscriptions."
      />
      <FilterBar>
        <FilterField label="Search user">
          <input className="input-field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="User name..." />
        </FilterField>
        <FilterField label="Plan">
          <select className="input-field" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
            <option value="all">All plans</option>
            <option value="Instant">Instant</option>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </FilterField>
        <FilterField label="Status">
          <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="expired">Expired</option>
          </select>
        </FilterField>
      </FilterBar>
      <p className="mb-3 text-sm text-slate-500">
        {loading ? "Loading..." : `${total.toLocaleString()} total · ${activeCount} active on this page`}
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
