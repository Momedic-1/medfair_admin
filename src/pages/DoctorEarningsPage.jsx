import { useEffect, useState } from "react";
import { PageHeader, FilterBar, FilterField } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { Pagination } from "../components/ui/Pagination";
import { formatNaira } from "../utils/format";
import { api } from "../api/client";

const PAGE_SIZE = 20;

export default function DoctorEarningsPage() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getDoctorEarnings({ search: search || undefined, page, pageSize: PAGE_SIZE }),
      api.getDoctorEarningsSummary(),
    ])
      .then(([result, sum]) => {
        setRows(result.items || []);
        setTotal(result.total || 0);
        setTotalPages(result.totalPages || 0);
        setSummary(sum);
      })
      .catch(() => {
        setRows([]);
        setTotal(0);
        setTotalPages(0);
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, [search, page]);

  const columns = [
    { key: "doctorName", label: "Doctor" },
    { key: "consultations", label: "Consultations" },
    { key: "totalEarnings", label: "Total earned", render: (r) => formatNaira(Number(r.totalEarnings)) },
    { key: "withdrawn", label: "Withdrawn", render: (r) => formatNaira(Number(r.withdrawn)) },
    { key: "balance", label: "Balance", render: (r) => formatNaira(Number(r.balance)) },
  ];

  return (
    <div>
      <PageHeader title="Doctor Earnings" description="Consultation earnings and withdrawals by doctor." />
      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="card"><p className="text-xs text-slate-500">Total earnings</p><p className="text-xl font-bold text-medfair">{formatNaira(Number(summary.totalEarnings))}</p></div>
          <div className="card"><p className="text-xs text-slate-500">Withdrawn</p><p className="text-xl font-bold text-slate-800">{formatNaira(Number(summary.withdrawn))}</p></div>
          <div className="card"><p className="text-xs text-slate-500">Outstanding balance</p><p className="text-xl font-bold text-emerald-600">{formatNaira(Number(summary.balance))}</p></div>
        </div>
      )}
      <FilterBar>
        <FilterField label="Search doctor">
          <input className="input-field" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Doctor name..." />
        </FilterField>
      </FilterBar>
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
