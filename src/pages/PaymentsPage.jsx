import { useEffect, useMemo, useState } from "react";
import { PageHeader, FilterBar, FilterField } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { StatusBadge } from "../components/ui/Badge";
import { formatDate, formatNaira } from "../utils/format";
import { api } from "../api/client";

function sumAmount(rows, status) {
  return rows
    .filter((r) => !status || String(r.status).toLowerCase() === status)
    .reduce((sum, r) => sum + Number(r.amount || 0), 0);
}

export default function PaymentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    api.getPayments({
      status: statusFilter !== "all" ? statusFilter : undefined,
      type: typeFilter !== "all" ? typeFilter : undefined,
    })
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [statusFilter, typeFilter]);

  const summary = useMemo(
    () => ({
      totalRevenue: sumAmount(rows, "success"),
      pending: sumAmount(rows, "pending"),
      totalVolume: rows.reduce((sum, r) => sum + Number(r.amount || 0), 0),
      count: rows.length,
      successfulCount: rows.filter((r) => String(r.status).toLowerCase() === "success").length,
    }),
    [rows],
  );

  const columns = [
    { key: "id", label: "Reference" },
    { key: "userName", label: "User" },
    { key: "type", label: "Type" },
    { key: "amount", label: "Amount", render: (r) => formatNaira(Number(r.amount)) },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    { key: "reference", label: "Paystack ref" },
    { key: "date", label: "Date", render: (r) => formatDate(r.date) },
  ];

  return (
    <div>
      <PageHeader title="Payments & Revenue" description="Platform payment transactions." />
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-xs text-slate-500">Total revenue</p>
          <p className="text-xl font-bold text-medfair">{formatNaira(summary.totalRevenue)}</p>
          <p className="mt-1 text-xs text-slate-400">{summary.successfulCount} successful</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500">Pending</p>
          <p className="text-xl font-bold text-amber-600">{formatNaira(summary.pending)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500">Total volume</p>
          <p className="text-xl font-bold text-slate-800">{formatNaira(summary.totalVolume)}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500">Transactions</p>
          <p className="text-xl font-bold text-slate-800">{summary.count}</p>
        </div>
      </div>
      <FilterBar>
        <FilterField label="Status">
          <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="pending">Pending</option>
          </select>
        </FilterField>
        <FilterField label="Type">
          <select className="input-field" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="Subscription">Subscription</option>
          </select>
        </FilterField>
      </FilterBar>
      <p className="mb-3 text-sm text-slate-500">{loading ? "Loading..." : `${rows.length} payment(s)`}</p>
      <DataTable columns={columns} data={rows} />
    </div>
  );
}
