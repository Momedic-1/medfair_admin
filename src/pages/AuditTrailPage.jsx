import { useEffect, useState } from "react";
import { PageHeader, FilterBar, FilterField } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { formatDateTime } from "../utils/format";
import { api } from "../api/client";

const ENTITY_TYPES = [
  { value: "", label: "All types" },
  { value: "complaint", label: "Complaints" },
  { value: "organization_wallet", label: "Organization wallet" },
  { value: "organization", label: "Organizations" },
  { value: "staff_user", label: "Staff users" },
  { value: "doctor_verification", label: "Doctor verification" },
  { value: "platform_user", label: "Platform users" },
];

export default function AuditTrailPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("");

  useEffect(() => {
    setLoading(true);
    api.getAuditTrail({
      search: search || undefined,
      entityType: entityType || undefined,
    })
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [search, entityType]);

  const columns = [
    {
      key: "performedAt",
      label: "When",
      render: (r) => (
        <span className="block min-w-[10rem] whitespace-normal text-sm leading-snug text-slate-700">
          {formatDateTime(r.performedAt)}
        </span>
      ),
    },
    { key: "performedBy", label: "Who" },
    { key: "entityTypeLabel", label: "Type" },
    { key: "entityLabel", label: "Item" },
    {
      key: "summary",
      label: "What happened",
      render: (r) => <span className="whitespace-normal text-sm text-slate-700">{r.summary}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Audit Trail"
        description="Super Admin view of who changed what across complaints, organization wallets, staff, and more."
      />

      <FilterBar>
        <FilterField label="Search">
          <input
            className="input-field"
            placeholder="Staff name, item, summary..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </FilterField>
        <FilterField label="Type">
          <select className="input-field" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
            {ENTITY_TYPES.map((opt) => (
              <option key={opt.value || "all"} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FilterField>
      </FilterBar>

      <p className="mb-3 text-sm text-slate-500">{loading ? "Loading..." : `${rows.length} event(s)`}</p>
      <DataTable columns={columns} data={rows} emptyMessage="No audit events found." />
    </div>
  );
}
