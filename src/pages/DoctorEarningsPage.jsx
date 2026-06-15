import { useEffect, useState } from "react";
import { PageHeader, FilterBar, FilterField } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { formatNaira } from "../utils/format";
import { api } from "../api/client";

export default function DoctorEarningsPage() {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      api.getDoctorEarnings({ search: search || undefined }),
      api.getDoctorEarningsSummary(),
    ])
      .then(([list, sum]) => {
        setRows(list);
        setSummary(sum);
      })
      .catch(() => {
        setRows([]);
        setSummary(null);
      })
      .finally(() => setLoading(false));
  }, [search]);

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
      <p className="mb-3 text-sm text-slate-500">{loading ? "Loading..." : `${rows.length} doctor(s)`}</p>
      <DataTable columns={columns} data={rows} />
    </div>
  );
}
