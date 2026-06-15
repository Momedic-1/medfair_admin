import { useEffect, useMemo, useState } from "react";
import { Plus, Eye, Wallet } from "lucide-react";
import { PageHeader } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import { StatusBadge } from "../components/ui/Badge";
import { useOrganizations } from "../context/OrganizationsContext";
import { useAuth } from "../context/AuthContext";
import { formatDate, formatNaira } from "../utils/format";
import { STAFF_ROLES } from "../constants/roles";
import { API_BASE } from "../api/client";

function OrgDetailModal({ org, open, onClose, onEditWallet, canEditWallet }) {
  if (!org) return null;

  return (
    <Modal open={open} onClose={onClose} title="Organization Details" wide>
      <div className="space-y-4">
        <div className="rounded-xl bg-medfair/5 p-4">
          <h3 className="text-lg font-bold text-medfair">{org.name}</h3>
          <p className="text-sm text-slate-500">Slug: {org.slug}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><p className="text-xs text-slate-400">Contact email</p><p className="font-medium">{org.email}</p></div>
          <div><p className="text-xs text-slate-400">Phone</p><p className="font-medium">{org.phone || "—"}</p></div>
          <div><p className="text-xs text-slate-400">Enrolled users</p><p className="font-medium">{org.users.toLocaleString()}</p></div>
          <div>
            <p className="text-xs text-slate-400">Wallet balance</p>
            <div className="flex items-center gap-2">
              <p className="font-medium text-medfair">{formatNaira(org.walletBalance)}</p>
              {canEditWallet && (
                <button type="button" onClick={() => onEditWallet(org)} className="text-xs font-semibold text-medfair hover:underline">
                  Edit
                </button>
              )}
            </div>
          </div>
          <div><p className="text-xs text-slate-400">Created</p><p className="font-medium">{org.createdAt ? formatDate(org.createdAt) : "—"}</p></div>
          <div><p className="text-xs text-slate-400">View prescriptions</p><p className="font-medium">{org.canViewPrescriptions ? "Enabled" : "Disabled"}</p></div>
          <div><p className="text-xs text-slate-400">View investigations</p><p className="font-medium">{org.canViewInvestigations ? "Enabled" : "Disabled"}</p></div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h4 className="text-sm font-bold text-slate-800">Organization portal login</h4>
          {org.portalLoginEnabled ? (
            <div className="mt-2 space-y-1 text-sm text-slate-600">
              <p><span className="font-medium">Admin:</span> {org.adminFullName}</p>
              <p><span className="font-medium">Login email:</span> {org.adminEmail}</p>
              <p className="text-xs text-slate-500">Portal endpoint: {API_BASE}/api/organization/login</p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-amber-700">No portal admin account — this org cannot log in yet.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function OrganizationsPage() {
  const { user } = useAuth();
  const { organizations, loading, error, addOrganization, updateWalletBalance, refresh } = useOrganizations();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletOrg, setWalletOrg] = useState(null);
  const [walletBalance, setWalletBalance] = useState("");
  const [walletReason, setWalletReason] = useState("");
  const [success, setSuccess] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    slug: "",
    adminFullName: "",
    adminEmail: "",
    adminPassword: "",
    canViewPrescriptions: false,
    canViewInvestigations: false,
  });

  const canEditWallet = [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.FINANCE].includes(user?.role);
  const canAddOrg = [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.OPERATIONS].includes(user?.role);

  const openWalletEditor = (org) => {
    setWalletOrg(org);
    setWalletBalance(String(org.walletBalance ?? 0));
    setWalletReason("");
    setWalletModalOpen(true);
    setSelectedOrg(null);
  };

  const handleWalletSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      await updateWalletBalance(walletOrg.id, Number(walletBalance), walletReason);
      setSuccess(`Wallet balance updated for ${walletOrg.name}.`);
      setWalletModalOpen(false);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const created = await addOrganization(form);
      setSuccess(
        `Partner organization "${form.name}" added. Portal login: ${created.adminEmail} (password you set).`
      );
      setForm({
        name: "",
        email: "",
        phone: "",
        slug: "",
        adminFullName: "",
        adminEmail: "",
        adminPassword: "",
        canViewPrescriptions: false,
        canViewInvestigations: false,
      });
      setModalOpen(false);
      setTimeout(() => setSuccess(""), 6000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "name", label: "Organization" },
    { key: "email", label: "Contact Email" },
    { key: "phone", label: "Phone", render: (r) => r.phone || "—" },
    { key: "users", label: "Users", render: (r) => r.users.toLocaleString() },
    { key: "walletBalance", label: "Wallet Balance", render: (r) => formatNaira(r.walletBalance) },
    { key: "status", label: "Status", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <div className="flex items-center gap-3">
          <button type="button" onClick={(e) => { e.stopPropagation(); setSelectedOrg(r); }} className="inline-flex items-center gap-1 text-sm font-medium text-medfair hover:underline">
            <Eye className="h-4 w-4" /> View
          </button>
          {canEditWallet && (
            <button type="button" onClick={(e) => { e.stopPropagation(); openWalletEditor(r); }} className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:underline">
              <Wallet className="h-4 w-4" /> Wallet
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Organization Partners"
        description="Create partner organizations with portal admin credentials so they can log in."
        action={
          canAddOrg ? (
            <button type="button" onClick={() => setModalOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Add Organization
            </button>
          ) : null
        }
      />

      {success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}
      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error} <button type="button" onClick={refresh} className="ml-2 underline">Retry</button></div>}

      <p className="mb-3 text-sm text-slate-500">{loading ? "Loading..." : `${organizations.length} partner organization(s)`}</p>
      <DataTable columns={columns} data={organizations} onRowClick={setSelectedOrg} />

      <OrgDetailModal org={selectedOrg} open={!!selectedOrg} onClose={() => setSelectedOrg(null)} onEditWallet={openWalletEditor} canEditWallet={canEditWallet} />

      <Modal open={walletModalOpen} onClose={() => setWalletModalOpen(false)} title={`Edit Wallet — ${walletOrg?.name}`}>
        <form onSubmit={handleWalletSubmit} className="space-y-4">
          {formError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">New wallet balance (NGN)</label>
            <input type="number" min="0" step="0.01" className="input-field" value={walletBalance} onChange={(e) => setWalletBalance(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Reason (optional)</label>
            <input className="input-field" value={walletReason} onChange={(e) => setWalletReason(e.target.value)} placeholder="e.g. Manual top-up, correction..." />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setWalletModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? "Saving..." : "Update Balance"}</button>
          </div>
        </form>
      </Modal>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Organization Partner" wide>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Organization name</label>
            <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Contact email</label>
              <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
              <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234..." required />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">URL slug (optional)</label>
            <input className="input-field" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="e.g. first-care-hospital" />
            <p className="mt-1 text-xs text-slate-500">Used for patient partner linking. Auto-generated from name if left blank.</p>
          </div>

          <div className="rounded-xl border border-medfair/20 bg-medfair/5 p-4">
            <h4 className="text-sm font-bold text-medfair">Portal admin account</h4>
            <p className="mt-1 text-xs text-slate-500">Required so the organization can log in at POST /api/organization/login</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Admin full name</label>
                <input className="input-field" value={form.adminFullName} onChange={(e) => setForm({ ...form, adminFullName: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Admin login email</label>
                <input type="email" className="input-field" value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} required />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Admin password</label>
                <input type="password" minLength={8} className="input-field" value={form.adminPassword} onChange={(e) => setForm({ ...form, adminPassword: e.target.value })} required />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.canViewPrescriptions} onChange={(e) => setForm({ ...form, canViewPrescriptions: e.target.checked })} className="rounded text-medfair" />
              Allow org admin to view prescriptions
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={form.canViewInvestigations} onChange={(e) => setForm({ ...form, canViewInvestigations: e.target.checked })} className="rounded text-medfair" />
              Allow org admin to view investigations
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? "Adding..." : "Add Organization"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
