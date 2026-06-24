import { ROLE_COLORS, ROLE_LABELS } from "../../constants/roles";

export function RoleBadge({ role }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${ROLE_COLORS[role] || "bg-slate-100 text-slate-700"}`}>
      {ROLE_LABELS[role] || role}
    </span>
  );
}

export function StatusBadge({ status }) {
  const styles = {
    active: "bg-emerald-100 text-emerald-800",
    success: "bg-emerald-100 text-emerald-800",
    completed: "bg-emerald-100 text-emerald-800",
    resolved: "bg-emerald-100 text-emerald-800",
    open: "bg-amber-100 text-amber-800",
    pending: "bg-amber-100 text-amber-800",
    pending_verification: "bg-amber-100 text-amber-800",
    in_progress: "bg-blue-100 text-blue-800",
    upcoming: "bg-indigo-100 text-indigo-800",
    cancelled: "bg-slate-100 text-slate-700",
    expired: "bg-slate-100 text-slate-600",
    high: "bg-red-100 text-red-800",
    medium: "bg-amber-100 text-amber-800",
    low: "bg-slate-100 text-slate-600",
    SUCCESS: "bg-emerald-100 text-emerald-800",
    PENDING: "bg-amber-100 text-amber-800",
    EXHAUSTED: "bg-red-100 text-red-800",
    FAILED: "bg-red-100 text-red-800",
  };

  const labels = {
    open: "pending",
  };

  const label = labels[status] || String(status).replace(/_/g, " ");

  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${styles[status] || "bg-slate-100 text-slate-700"}`}>
      {label}
    </span>
  );
}

export function ComplaintStatusBadge({ status }) {
  return <StatusBadge status={status} />;
}

export function PriorityBadge({ priority }) {
  return <StatusBadge status={priority} />;
}
