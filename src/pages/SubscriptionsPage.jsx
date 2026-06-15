import { useEffect, useMemo, useState } from "react";
import { PageHeader, FilterBar, FilterField } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { StatusBadge } from "../components/ui/Badge";
import { formatDate, formatNaira } from "../utils/format";
import { api } from "../api/client";

export default function SubscriptionsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    api.getSubscriptions({ search: search || undefined, plan: planFilter !== "all" ? planFilter : undefined })
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [search, planFilter]);

  const filteredRows = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

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
        {loading
          ? "Loading..."
          : `${filteredRows.length} shown · ${activeCount} active · ${rows.length} total`}
      </p>
      <DataTable columns={columns} data={filteredRows} />
    </div>
  );
}
