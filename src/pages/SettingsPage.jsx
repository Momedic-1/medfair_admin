import { useEffect, useState } from "react";
import { PageHeader } from "../components/ui/PageHeader";
import { useAuth } from "../context/AuthContext";
import { STAFF_ROLES } from "../constants/roles";
import { API_BASE, api } from "../api/client";

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if ([STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.OPERATIONS].includes(user?.role)) {
      api.getSettings().then(setSettings).catch(() => setSettings(null));
    }
  }, [user?.role]);

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage("");
    setPasswordError("");

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation do not match.");
      return;
    }

    setSaving(true);
    try {
      const result = await api.changePassword(currentPassword, newPassword);
      setPasswordMessage(result.message || "Password updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordError(err.message || "Could not update password.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Account security and platform configuration." />
      <div className="grid max-w-2xl gap-6">
        <form onSubmit={handlePasswordSubmit} className="card space-y-4">
          <h3 className="font-semibold text-slate-800">Change password</h3>
          <p className="text-sm text-slate-600">
            Update your staff account password while you are signed in.
          </p>

          {passwordError && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {passwordError}
            </div>
          )}
          {passwordMessage && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {passwordMessage}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Current password</label>
            <input
              type="password"
              className="input-field"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">New password</label>
            <input
              type="password"
              className="input-field"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Confirm new password</label>
            <input
              type="password"
              className="input-field"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Updating..." : "Update password"}
          </button>
        </form>

        <div className="card space-y-3">
          <h3 className="font-semibold text-slate-800">Locked out?</h3>
          <p className="text-sm text-slate-600">
            Locked out? Use <span className="font-medium">Forgot password</span> on the login page to submit a reset request.
            Super Admin or Technical staff will reset it from Staff Users.
          </p>
        </div>

        {[STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.OPERATIONS].includes(user?.role) && (
        <div className="card space-y-3">
          <h3 className="font-semibold text-slate-800">API Connection</h3>
          <p className="text-sm text-slate-600"><span className="font-medium">Admin API:</span> {API_BASE}</p>
          {settings && (
            <>
              <p className="text-sm text-slate-600"><span className="font-medium">Environment:</span> {settings.environment}</p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Organization portal login:</span>{" "}
                {API_BASE}{settings.organizationPortalLoginPath}
              </p>
            </>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
