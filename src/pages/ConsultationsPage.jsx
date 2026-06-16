import { useEffect, useState } from "react";
import { PageHeader, FilterBar, FilterField } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { Pagination } from "../components/ui/Pagination";
import { StatusBadge } from "../components/ui/Badge";
import { formatDate } from "../utils/format";
import { api } from "../api/client";

const PAGE_SIZE = 20;

export default function ConsultationsPage() {
  const [rows, setRows] = useState([]);
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
    setLoading(true);
    api.getConsultations({
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
    { key: "patientName", label: "Patient" },
    { key: "doctorName", label: "Doctor" },
    { key: "type", label: "Type" },
    { key: "date", label: "Date", render: (r) => formatDate(r.date) },
    { key: "time", label: "Time" },
    { key: "organization", label: "Organization", render: (r) => r.organization || "—" },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader title="Consultations" description="Scheduled and instant video consultations." />
      <FilterBar>
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
      <p className="mb-3 text-sm text-slate-500">
        {loading ? "Loading..." : `${total} consultation(s)`}
      </p>
      <DataTable columns={columns} data={rows} />
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
    </div>
  );
}
