import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader, FilterBar, FilterField } from "../components/ui/PageHeader";
import { DataTable } from "../components/ui/DataTable";
import { Modal } from "../components/ui/Modal";
import { PriorityBadge, StatusBadge } from "../components/ui/Badge";
import { formatDateTime } from "../utils/format";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { STAFF_ROLES } from "../constants/roles";

const STATUS_OPTIONS = [
  { value: "open", label: "Pending", className: "bg-amber-100 text-amber-900 border-amber-300" },
  { value: "in_progress", label: "In progress", className: "bg-blue-100 text-blue-900 border-blue-300" },
  { value: "resolved", label: "Resolved", className: "bg-emerald-100 text-emerald-900 border-emerald-300" },
];

const PRIORITY_OPTIONS = [
  { value: "high", label: "High", className: "bg-red-100 text-red-900 border-red-300" },
  { value: "medium", label: "Medium", className: "bg-amber-100 text-amber-900 border-amber-300" },
  { value: "low", label: "Low", className: "bg-slate-100 text-slate-700 border-slate-300" },
];

const SOURCE_LABELS = {
  patient_app: "Patient app",
  phone: "Phone",
  email: "Email",
  staff: "Staff logged",
};

const CATEGORY_OPTIONS = [
  { value: "billing", label: "Billing / payment" },
  { value: "consultation", label: "Consultation" },
  { value: "technical", label: "Technical / account" },
  { value: "account", label: "Account" },
];

const PRIORITY_GUIDE = [
  { category: "Billing / payment", priority: "high" },
  { category: "Consultation", priority: "medium" },
  { category: "Technical / account", priority: "low" },
];

function ColoredSelect({ value, options, onChange, disabled, saving }) {
  const selected = options.find((opt) => opt.value === value) || options[0];

  return (
    <select
      className={`min-w-[9rem] rounded-lg border px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-medfair/30 ${selected?.className || ""}`}
      value={value}
      onChange={onChange}
      disabled={disabled || saving}
      onClick={(e) => e.stopPropagation()}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}

function ComplaintStatusCell({ complaint, canUpdate, onUpdated }) {
  const [saving, setSaving] = useState(false);

  const handleChange = async (e) => {
    const next = e.target.value;
    const optimistic = { ...complaint, status: next };
    onUpdated(optimistic);
    setSaving(true);
    try {
      onUpdated(await api.updateComplaint(complaint.id, { status: next }));
    } catch {
      onUpdated(complaint);
    } finally {
      setSaving(false);
    }
  };

  if (!canUpdate) return <StatusBadge status={complaint.status} />;

  return (
    <div>
      <ColoredSelect
        value={complaint.status}
        options={STATUS_OPTIONS}
        onChange={handleChange}
        saving={saving}
      />
      {saving && <p className="mt-0.5 text-[10px] text-slate-400">Saving...</p>}
    </div>
  );
}

function ComplaintPriorityCell({ complaint, canUpdate, onUpdated }) {
  const [saving, setSaving] = useState(false);

  const handleChange = async (e) => {
    const next = e.target.value;
    onUpdated({ ...complaint, priority: next });
    setSaving(true);
    try {
      onUpdated(await api.updateComplaint(complaint.id, { priority: next }));
    } catch {
      onUpdated(complaint);
    } finally {
      setSaving(false);
    }
  };

  if (!canUpdate) return <PriorityBadge priority={complaint.priority} />;

  return (
    <div>
      <ColoredSelect
        value={complaint.priority || "medium"}
        options={PRIORITY_OPTIONS}
        onChange={handleChange}
        saving={saving}
      />
      {saving && <p className="mt-0.5 text-[10px] text-slate-400">Saving...</p>}
    </div>
  );
}

function ComplaintAssigneeCell({ complaint, assignees, currentUserName, canUpdate, onUpdated }) {
  const [saving, setSaving] = useState(false);

  const saveAssignee = async (name) => {
    onUpdated({ ...complaint, assignedTo: name || null });
    setSaving(true);
    try {
      onUpdated(await api.updateComplaint(complaint.id, { assignedTo: name || "" }));
    } catch {
      onUpdated(complaint);
    } finally {
      setSaving(false);
    }
  };

  if (!canUpdate) return <span>{complaint.assignedTo || "Unassigned"}</span>;

  return (
    <div className="min-w-[10rem] space-y-1">
      <select
        className="input-field !py-1.5 text-xs"
        value={complaint.assignedTo || ""}
        onChange={(e) => saveAssignee(e.target.value)}
        disabled={saving}
        onClick={(e) => e.stopPropagation()}
      >
        <option value="">Unassigned</option>
        {assignees.map((a) => (
          <option key={a.id} value={a.fullName}>{a.fullName}</option>
        ))}
      </select>
      {currentUserName && complaint.assignedTo !== currentUserName && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); saveAssignee(currentUserName); }}
          className="text-[10px] font-semibold text-medfair hover:underline"
          disabled={saving}
        >
          Assign to me
        </button>
      )}
      {saving && <p className="text-[10px] text-slate-400">Saving...</p>}
    </div>
  );
}

function ComplaintDetailModal({ complaint, open, onClose }) {
  if (!complaint) return null;

  return (
    <Modal open={open} onClose={onClose} title={complaint.subject} wide>
      <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">User</p>
          <p className="font-medium text-slate-800">{complaint.userName}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Logged by</p>
          <p className="font-medium text-slate-800">{complaint.loggedBy || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Created</p>
          <p className="font-medium text-slate-800">{formatDateTime(complaint.createdAt)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Source</p>
          <p className="font-medium text-slate-800">{SOURCE_LABELS[complaint.source] || complaint.source || "—"}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Status</p>
          <StatusBadge status={complaint.status} />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-slate-400">Priority</p>
          <PriorityBadge priority={complaint.priority} />
        </div>
        <div className="sm:col-span-2">
          <p className="text-xs font-semibold uppercase text-slate-400">Assigned to</p>
          <p className="font-medium text-slate-800">{complaint.assignedTo || "Unassigned"}</p>
        </div>
        {complaint.description && (
          <div className="sm:col-span-2">
            <p className="text-xs font-semibold uppercase text-slate-400">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-slate-700">{complaint.description}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default function ComplaintsPage() {
  const { user } = useAuth();
  const canUpdate = [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.CUSTOMER_SERVICE].includes(user?.role);
  const [rows, setRows] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [platformUsers, setPlatformUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [logOpen, setLogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    userId: "",
    userName: "",
    subject: "",
    description: "",
    category: "billing",
    priority: "",
    source: "staff",
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.getComplaints({
        search: search || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
      }),
      canUpdate ? api.getComplaintAssignees().catch(() => []) : Promise.resolve([]),
      canUpdate ? api.getPlatformUsers().catch(() => []) : Promise.resolve([]),
    ])
      .then(([complaints, staff, users]) => {
        setRows(Array.isArray(complaints) ? complaints : complaints?.items || []);
        setAssignees(Array.isArray(staff) ? staff : staff?.items || []);
        setPlatformUsers(Array.isArray(users) ? users : users?.items || []);
      })
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, statusFilter, priorityFilter, canUpdate]);

  const handleUpdated = (updated) => {
    setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    if (selected?.id === updated.id) setSelected(updated);
  };

  const openDetail = (row) => {
    setSelected(row);
    setDetailOpen(true);
  };

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    setSubmitting(true);
    try {
      const payload = {
        subject: form.subject,
        description: form.description || undefined,
        category: form.category,
        source: form.source,
        priority: form.priority || undefined,
      };
      if (form.userId) {
        payload.userId = Number(form.userId);
      } else if (form.userName.trim()) {
        payload.userName = form.userName.trim();
      } else {
        throw new Error("Select a platform user or enter a caller name");
      }
      const created = await api.createComplaint(payload);
      setRows((prev) => [created, ...prev]);
      setSuccess("Complaint logged successfully.");
      setLogOpen(false);
      setForm({ userId: "", userName: "", subject: "", description: "", category: "billing", priority: "", source: "staff" });
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    { key: "subject", label: "Subject" },
    { key: "userName", label: "User" },
    { key: "source", label: "Source", render: (r) => SOURCE_LABELS[r.source] || r.source || "—" },
    { key: "category", label: "Category", render: (r) => <span className="capitalize">{r.category}</span> },
    {
      key: "priority",
      label: "Priority",
      render: (r) => <ComplaintPriorityCell complaint={r} canUpdate={canUpdate} onUpdated={handleUpdated} />,
    },
    {
      key: "status",
      label: "Status",
      render: (r) => <ComplaintStatusCell complaint={r} canUpdate={canUpdate} onUpdated={handleUpdated} />,
    },
    {
      key: "loggedBy",
      label: "Logged by",
      render: (r) => <span className="text-slate-700">{r.loggedBy || "—"}</span>,
    },
    {
      key: "assignedTo",
      label: "Assigned to",
      render: (r) => (
        <ComplaintAssigneeCell
          complaint={r}
          assignees={assignees}
          currentUserName={user?.fullName}
          canUpdate={canUpdate}
          onUpdated={handleUpdated}
        />
      ),
    },
    {
      key: "createdAt",
      label: "Created",
      render: (r) => (
        <span className="block min-w-[10rem] whitespace-normal text-sm leading-snug text-slate-700">
          {formatDateTime(r.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Complaints"
        description="Complaints come from the patient app, phone, or email. Customer service can also log them here."
        action={
          canUpdate ? (
            <button type="button" onClick={() => setLogOpen(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Log Complaint
            </button>
          ) : null
        }
      />

      {success && <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>}

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="text-sm font-bold text-slate-800">How priority is set</h3>
          <p className="mt-1 text-xs text-slate-500">
            Priority is suggested from the complaint category when submitted. Customer service can override it below.
          </p>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {PRIORITY_GUIDE.map((item) => (
              <li key={item.category} className="flex items-center justify-between gap-3">
                <span>{item.category}</span>
                <PriorityBadge priority={item.priority} />
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
          <h3 className="text-sm font-bold text-slate-800">Who assigns complaints?</h3>
          <p className="mt-2 text-sm text-slate-600">
            Super Admin or any Customer Service member assigns complaints using the dropdown,
            or clicks <span className="font-medium">Assign to me</span>.
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Setting status to <span className="font-medium">In progress</span> auto-assigns you if still unassigned.
          </p>
          {assignees.length > 0 && (
            <p className="mt-3 text-xs text-slate-500">
              Available agents: {assignees.map((a) => a.fullName).join(", ")}
            </p>
          )}
        </div>
      </div>

      <FilterBar>
        <FilterField label="Search">
          <input className="input-field" placeholder="Subject or user..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </FilterField>
        <FilterField label="Status">
          <select className="input-field" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All statuses</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FilterField>
        <FilterField label="Priority">
          <select className="input-field" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="all">All priorities</option>
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </FilterField>
      </FilterBar>
      <p className="mb-3 text-sm text-slate-500">{loading ? "Loading..." : `${rows.length} complaint(s)`}</p>
      <DataTable columns={columns} data={rows} onRowClick={openDetail} />

      <ComplaintDetailModal
        complaint={selected}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />

      <Modal open={logOpen} onClose={() => setLogOpen(false)} title="Log Complaint" wide>
        <form onSubmit={handleLogSubmit} className="space-y-4">
          {formError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{formError}</div>}

          <div className="rounded-xl border border-medfair/20 bg-medfair/5 px-4 py-3 text-sm text-slate-700">
            <span className="font-medium text-slate-800">Logged by:</span>{" "}
            {user?.fullName || user?.email || "Current staff user"}
            <p className="mt-1 text-xs text-slate-500">This is recorded automatically when you submit.</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Platform user (optional)</label>
            <select
              className="input-field"
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value, userName: "" })}
            >
              <option value="">— Select patient/doctor —</option>
              {platformUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </div>

          {!form.userId && (
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Caller / user name</label>
              <input
                className="input-field"
                value={form.userName}
                onChange={(e) => setForm({ ...form, userName: e.target.value })}
                placeholder="e.g. Amaka Nwosu or Org admin callback"
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Subject</label>
            <input className="input-field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Description</label>
            <textarea
              className="input-field min-h-[80px]"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="What happened? Steps to reproduce, etc."
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Category</label>
              <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required>
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Source</label>
              <select className="input-field" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                <option value="staff">Staff logged</option>
                <option value="phone">Phone call</option>
                <option value="email">Email</option>
                <option value="patient_app">Patient app</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Priority (optional — auto from category)</label>
            <select className="input-field" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="">Auto</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setLogOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">{submitting ? "Saving..." : "Log Complaint"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
