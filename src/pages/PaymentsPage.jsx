import { useEffect, useState } from "react";
import { PageHeader, FilterBar, FilterField } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { Pagination } from "../components/ui/Pagination";
import { StatusBadge } from "../components/ui/Badge";
import { formatDate, formatNaira } from "../utils/format";
import { api } from "../api/client";

const PAGE_SIZE = 20;

const EMPTY_SUMMARY = {
  totalRevenue: 0,
  pending: 0,
  totalVolume: 0,
  count: 0,
  successfulCount: 0,
};

export default function PaymentsPage() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    setPage(1);
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    api.getPaymentsSummary()
      .then((data) => setSummary(data || EMPTY_SUMMARY))
      .catch(() => setSummary(EMPTY_SUMMARY));
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getPayments({
      status: statusFilter !== "all" ? statusFilter : undefined,
      type: typeFilter !== "all" ? typeFilter : undefined,
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
  }, [statusFilter, typeFilter, page]);

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
          <p className="text-xl font-bold text-medfair">{formatNaira(Number(summary.totalRevenue))}</p>
          <p className="mt-1 text-xs text-slate-400">{summary.successfulCount} successful</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500">Pending</p>
          <p className="text-xl font-bold text-amber-600">{formatNaira(Number(summary.pending))}</p>
        </div>
        <div className="card">
          <p className="text-xs text-slate-500">Total volume</p>
          <p className="text-xl font-bold text-slate-800">{formatNaira(Number(summary.totalVolume))}</p>
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
      <p className="mb-3 text-sm text-slate-500">
        {loading ? "Loading..." : `${total} payment(s)`}
      </p>
      <DataTable columns={columns} data={rows} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
