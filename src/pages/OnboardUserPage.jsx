import { useState } from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { useOrganizations } from "../context/OrganizationsContext";
import { api } from "../api/client";

export default function OnboardUserPage() {
  const { organizations } = useOrganizations();
  const [form, setForm] = useState({
    userType: "PATIENT",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organizationId: "",
    specialization: "",
    sendWelcomeEmail: false,
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isDoctor = form.userType === "DOCTOR";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      const created = await api.onboardPlatformUser({
        userType: form.userType,
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        phone: form.phone,
        organizationId: form.organizationId ? Number(form.organizationId) : null,
        specialization: isDoctor ? form.specialization : undefined,
        sendWelcomeEmail: form.sendWelcomeEmail,
      });
      setSuccess(`${created.name} onboarded successfully as ${created.role}.`);
      setForm({
        userType: "PATIENT",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        organizationId: "",
        specialization: "",
        sendWelcomeEmail: false,
      });
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Onboard Patient / Doctor"
        description="Register a new patient or doctor on the MedFair platform. Super Admin only."
      />

      {success && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{success}</div>
      )}
      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="card max-w-2xl space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">User type</label>
          <div className="flex gap-3">
            {["PATIENT", "DOCTOR"].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setForm({ ...form, userType: type })}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                  form.userType === type
                    ? "border-medfair bg-medfair/5 text-medfair"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                {type === "PATIENT" ? "Patient" : "Doctor"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">First name</label>
            <input className="input-field" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Last name</label>
            <input className="input-field" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Email</label>
          <input type="email" className="input-field" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Phone</label>
          <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234..." required />
        </div>

        {!isDoctor && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Organization (optional)</label>
            <select className="input-field" value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })}>
              <option value="">No organization</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
          </div>
        )}

        {isDoctor && (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Specialization</label>
            <select className="input-field" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} required>
              <option value="">Select specialization</option>
              <option value="General Practice">General Practice</option>
              <option value="ENT">ENT</option>
              <option value="Mental Health">Mental Health</option>
              <option value="Urology">Urology</option>
              <option value="Women's Health">Women&apos;s Health</option>
            </select>
          </div>
        )}

        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Onboarding..." : `Onboard ${isDoctor ? "Doctor" : "Patient"}`}
        </button>
      </form>
    </div>
  );
}
