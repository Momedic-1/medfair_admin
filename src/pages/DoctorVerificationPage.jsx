import { useEffect, useState } from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { StatusBadge } from "../components/ui/Badge";
import { formatDate } from "../utils/format";
import { api } from "../api/client";

export default function DoctorVerificationPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.getDoctorVerifications()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    await api.approveDoctor(id);
    load();
  };

  const handleReject = async (id) => {
    await api.rejectDoctor(id);
    load();
  };

  const columns = [
    { key: "name", label: "Doctor" },
    { key: "email", label: "Email" },
    { key: "specialization", label: "Specialization" },
    { key: "submittedAt", label: "Submitted", render: (r) => formatDate(r.submittedAt) },
    { key: "credentialsUploaded", label: "Credentials", render: (r) => (r.credentialsUploaded ? "Uploaded" : "Missing") },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex gap-2">
          <button type="button" onClick={() => handleApprove(r.id)} className="text-sm font-medium text-emerald-600 hover:underline">Approve</button>
          <button type="button" onClick={() => handleReject(r.id)} className="text-sm font-medium text-red-600 hover:underline">Reject</button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Doctor Verification" description="Review and approve doctor credentials." />
      <p className="mb-3 text-sm text-slate-500">{loading ? "Loading..." : `${rows.length} pending doctor(s)`}</p>
      <DataTable columns={columns} data={rows} />
    </div>
  );
}
