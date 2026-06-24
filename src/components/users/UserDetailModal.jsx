import { useEffect, useState } from "react";
import { Modal } from "../ui/Modal";
import { StatusBadge } from "../ui/Badge";
import { formatDate } from "../../utils/format";
import { api } from "../../api/client";

function DetailRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between">
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-sm font-medium text-slate-800 sm:max-w-[60%] sm:text-right">{value || "—"}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4">
      <h4 className="mb-3 text-sm font-bold text-medfair">{title}</h4>
      {children}
    </div>
  );
}

export function UserDetailModal({
  user,
  open,
  onClose,
  organizations = [],
  canAssignOrganization = false,
  onUserUpdated,
}) {
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!user) return;
    setSelectedOrgId(user.organizationId != null ? String(user.organizationId) : "");
    setError("");
    setSuccess("");
  }, [user]);

  if (!user) return null;

  const isDoctor = user.role === "DOCTOR";
  const isPatient = user.role === "PATIENT";

  const handleAssignOrganization = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const organizationId = selectedOrgId ? Number(selectedOrgId) : null;
      const updated = await api.assignPlatformUserOrganization(user.id, organizationId);
      setSuccess(
        organizationId
          ? `Assigned to ${updated.organization || "organization"}.`
          : "Organization removed."
      );
      onUserUpdated?.(updated);
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      setError(err.message || "Failed to update organization");
    } finally {
      setSaving(false);
    }
  };

  const orgChanged =
    (selectedOrgId || "") !== (user.organizationId != null ? String(user.organizationId) : "");

  return (
    <Modal open={open} onClose={onClose} title="User Profile" wide>
      <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
        <div className="flex items-start justify-between gap-4 rounded-xl bg-gradient-to-r from-medfair/10 to-blue-50 p-4">
          <div>
            <h3 className="text-xl font-bold text-medfair">{user.name}</h3>
            <p className="mt-1 text-sm text-slate-500">User ID: {user.id}</p>
          </div>
          <StatusBadge status={user.status} />
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {success}
          </div>
        )}

        <Section title="Contact Information">
          <DetailRow label="Email" value={user.email} />
          <DetailRow label="Phone" value={user.phone} />
          <DetailRow label="Gender" value={user.gender} />
          {user.dateOfBirth && <DetailRow label="Date of birth" value={formatDate(user.dateOfBirth)} />}
        </Section>

        <Section title="Address">
          <DetailRow label="Street" value={user.address?.street} />
          <DetailRow label="City" value={user.address?.city} />
          <DetailRow label="State" value={user.address?.state} />
          <DetailRow label="Country" value={user.address?.country || "Nigeria"} />
        </Section>

        <Section title="Account Details">
          <DetailRow label="Role" value={user.role} />
          {isPatient && canAssignOrganization ? (
            <div className="border-b border-slate-100 py-3 last:border-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Organization</p>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                <select
                  className="input-field flex-1"
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  disabled={saving}
                >
                  <option value="">No organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-primary shrink-0"
                  onClick={handleAssignOrganization}
                  disabled={saving || !orgChanged}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Current: {user.organization || "Not assigned"}
              </p>
            </div>
          ) : (
            <DetailRow label="Organization" value={user.organization} />
          )}
          <DetailRow label="Registered" value={formatDate(user.registeredAt)} />
          {user.fileNumber && <DetailRow label="File number" value={user.fileNumber} />}
          {user.referredBy && <DetailRow label="Referred by" value={user.referredBy} />}
        </Section>

        {isPatient && user.emergencyContact && (
          <Section title="Emergency Contact">
            <DetailRow label="Name" value={user.emergencyContact.name} />
            <DetailRow label="Phone" value={user.emergencyContact.phone} />
            <DetailRow label="Relationship" value={user.emergencyContact.relationship} />
          </Section>
        )}

        {isDoctor && (
          <Section title="Professional Details">
            <DetailRow label="Specialization" value={user.specialization} />
            <DetailRow label="Hospital" value={user.hospital} />
            <DetailRow label="License number" value={user.licenseNumber} />
            <DetailRow label="Years of experience" value={user.yearsExperience} />
            <DetailRow label="Verified" value={user.verified ? "Yes" : "No"} />
          </Section>
        )}

        {user.subscription && (
          <Section title="Subscription">
            <DetailRow label="Plan" value={user.subscription.plan} />
            <DetailRow label="Expires" value={formatDate(user.subscription.expirationDate)} />
            <DetailRow label="Consultations left" value={user.subscription.consultationsRemaining} />
          </Section>
        )}
      </div>
    </Modal>
  );
}
