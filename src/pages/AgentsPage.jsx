import { useEffect, useState } from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { StatusBadge } from "../components/ui/Badge";
import { formatNaira } from "../utils/format";
import { api } from "../api/client";

export default function AgentsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getAgents()
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const columns = [
    { key: "name", label: "Agent" },
    { key: "referralCode", label: "Referral code" },
    { key: "patientsReferred", label: "Patients referred" },
    { key: "earnings", label: "Earnings", render: (r) => formatNaira(Number(r.earnings)) },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <div>
      <PageHeader title="Referral Agents" description="Agents and referral performance." />
      <p className="mb-3 text-sm text-slate-500">{loading ? "Loading..." : `${rows.length} agent(s)`}</p>
      <DataTable columns={columns} data={rows} />
    </div>
  );
}
