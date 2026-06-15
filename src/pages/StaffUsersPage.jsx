import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { PageHeader, FilterBar, FilterField } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { Pagination } from "../components/ui/Pagination";
import { Modal } from "../components/ui/Modal";
import { RoleBadge } from "../components/ui/Badge";
import { STAFF_ROLES, ROLE_LABELS } from "../constants/roles";
import { formatDate } from "../utils/format";
import { api } from "../api/client";

const PAGE_SIZE = 20;

const ASSIGNABLE_ROLES = {
  [STAFF_ROLES.SUPER_ADMIN]: Object.entries(ROLE_LABELS),
  [STAFF_ROLES.TECHNICAL]: Object.entries(ROLE_LABELS).filter(([value]) => value !== STAFF_ROLES.SUPER_ADMIN),
};

export default function StaffUsersPage() {
  const { user, createStaffUser, toggleStaffActive, resetStaffPassword } = useAuth();
  const isSuperAdmin = user?.role === STAFF_ROLES.SUPER_ADMIN;
  const canResetPasswords = [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.TECHNICAL].includes(user?.role);
  const roleOptions = ASSIGNABLE_ROLES[user?.role] || [];

  const [staffUsers, setStaffUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetConfirm, setResetConfirm] = useState("");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    role: STAFF_ROLES.CUSTOMER_SERVICE,
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [resetError, setResetError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const result = await api.getStaffUsers({
          search: search || undefined,
          page,
          pageSize: PAGE_SIZE,
        });
        if (!cancelled) {
          setStaffUsers(result.items || []);
          setTotal(result.total || 0);
          setTotalPages(result.totalPages || 0);
        }
      } catch {
        if (!cancelled) {
          setStaffUsers([]);
          setTotal(0);
          setTotalPages(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [search, page, refreshKey]);

  const reload = () => setRefreshKey((k) => k + 1);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await createStaffUser(form);
      setSuccess(`Staff user ${form.fullName} created successfully.`);
      setForm({ fullName: "", email: "", password: "", role: STAFF_ROLES.CUSTOMER_SERVICE });
      setModalOpen(false);
      reload();
    } catch (err) {
      setError(err.message);
    }
  };

  const openResetModal = (staff) => {
    setResetTarget(staff);
    setResetPassword("");
    setResetConfirm("");
    setResetError("");
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setResetError("");

    if (resetPassword.length < 8) {
      setResetError("Password must be at least 8 characters.");
      return;
    }
    if (resetPassword !== resetConfirm) {
      setResetError("Password and confirmation do not match.");
      return;
    }

    try {
      await resetStaffPassword(resetTarget.id, resetPassword);
      setSuccess(`Password reset for ${resetTarget.fullName}.`);
      setResetTarget(null);
      reload();
    } catch (err) {
      setResetError(err.message);
    }
  };

  const columns = [
    { key: "fullName", label: "Name" },
    { key: "email", label: "Email" },
    { key: "role", label: "Role", render: (r) => <RoleBadge role={r.role} /> },
    { key: "createdAt", label: "Created", render: (r) => formatDate(r.createdAt) },
    {
      key: "active",
      label: "Status",
      render: (r) => (
        <span className={`text-xs font-semibold ${r.active ? "text-emerald-600" : "text-slate-400"}`}>
          {r.active ? "Active" : "Inactive"}
        </span>
      ),
    },
    ...(canResetPasswords || isSuperAdmin
      ? [
          {
            key: "actions",
            label: "Actions",
            render: (r) => (
              <div className="flex flex-wrap gap-3">
                {canResetPasswords && (
                  <button
                    type="button"
                    onClick={() => openResetModal(r)}
                    className="text-sm font-medium text-medfair hover:underline"
                  >
                    Reset password
                  </button>
                )}
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={() => toggleStaffActive(r.id).then(reload).catch(() => {})}
                    className="text-sm font-medium text-medfair hover:underline"
                  >
                    {r.active ? "Deactivate" : "Activate"}
                  </button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title="Staff Users"
        description={
          isSuperAdmin
            ? "Create and manage internal MedFair staff accounts."
            : "Onboard staff and reset passwords. Contact Super Admin to deactivate users."
        }
        action={
          <button type="button" onClick={() => setModalOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Create Staff User
          </button>
        }
      />

      {success && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <FilterBar>
        <FilterField label="Search">
          <input
            className="input-field"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name or email..."
          />
        </FilterField>
      </FilterBar>

      <DataTable columns={columns} data={staffUsers} />
      <Pagination
        page={page}
        totalPages={totalPages}
        total={total}
        pageSize={PAGE_SIZE}
        loading={loading}
        onPageChange={setPage}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Create Staff User" wide>
        <form onSubmit={handleCreate} className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Full name</label>
            <input
              className="input-field"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              className="input-field"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              className="input-field"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={6}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
            <select
              className="input-field"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              required
            >
              {roleOptions.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create User
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!resetTarget}
        onClose={() => setResetTarget(null)}
        title={resetTarget ? `Reset password — ${resetTarget.fullName}` : "Reset password"}
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          {resetError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{resetError}</div>
          )}

          <p className="text-sm text-slate-600">
            Set a new password for <span className="font-medium">{resetTarget?.email}</span>. Share it securely with the staff member.
          </p>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">New password</label>
            <input
              type="password"
              className="input-field"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm password</label>
            <input
              type="password"
              className="input-field"
              value={resetConfirm}
              onChange={(e) => setResetConfirm(e.target.value)}
              minLength={8}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setResetTarget(null)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Reset password
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
