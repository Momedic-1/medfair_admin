import { useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { PageHeader, FilterBar, FilterField } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { StatusBadge } from "../components/ui/Badge";
import { UserDetailModal } from "../components/users/UserDetailModal";
import { formatDate } from "../utils/format";
import { api } from "../api/client";
import { useOrganizations } from "../context/OrganizationsContext";

export default function PlatformUsersPage() {
  const { organizations } = useOrganizations();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [orgFilter, setOrgFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const list = await api.getPlatformUsers({
          search: search || undefined,
          role: roleFilter !== "all" ? roleFilter : undefined,
          status: statusFilter !== "all" ? statusFilter : undefined,
        });
        if (!cancelled) setUsers(list);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [search, roleFilter, statusFilter]);

  const filtered = useMemo(() => {
    return users.filter((user) => {
      if (orgFilter === "all") return true;
      if (orgFilter === "none") return !user.organization;
      return user.organization === orgFilter;
    });
  }, [users, orgFilter]);

  const openUser = async (user) => {
    try {
      const detail = await api.getPlatformUser(user.id);
      setSelectedUser(detail);
    } catch {
      setSelectedUser(user);
    }
  };

  const columns = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "role", label: "Role", render: (r) => <span className="font-medium">{r.role}</span> },
    { key: "organization", label: "Organization", render: (r) => r.organization || "—" },
    { key: "registeredAt", label: "Registered", render: (r) => formatDate(r.registeredAt) },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "view",
      label: "",
      render: (r) => (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); openUser(r); }}
          className="inline-flex items-center gap-1 text-sm font-medium text-medfair hover:underline"
        >
          <Eye className="h-4 w-4" />
          View
        </button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Platform Users"
        description="Patients and doctors registered on the MedFair platform."
      />

      <FilterBar>
        <FilterField label="Search">
          <input className="input-field" placeholder="Name, email, phone..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </FilterField>
        <FilterField label="Role">
          <select className="input-field" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="all">All roles</option>
            <option value="PATIENT">Patient</option>
            <option value="DOCTOR">Doctor</option>
          </select>
        </FilterField>
        <FilterField label="Organization">
          <select className="input-field" value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}>
            <option value="all">All organizations</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.name}>{org.name}</option>
            ))}
            <option value="none">No organization</option>
          </select>
        </FilterField>
        <FilterField label="Status">
          <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
            <option value="pending_verification">Pending verification</option>
          </select>
        </FilterField>
      </FilterBar>

      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      <p className="mb-3 text-sm text-slate-500">{loading ? "Loading..." : `${filtered.length} user(s) found`}</p>
      <DataTable columns={columns} data={filtered} onRowClick={openUser} />

      <UserDetailModal user={selectedUser} open={!!selectedUser} onClose={() => setSelectedUser(null)} />
    </div>
  );
}
