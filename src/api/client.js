const PRODUCTION_API_URL = "https://backend-h3k6.onrender.com";

/** Dev uses localhost; production uses VITE_API_URL or the Render backend (never localhost). */
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? PRODUCTION_API_URL : "http://localhost:8081");

function getToken() {
  try {
    const raw = localStorage.getItem("medfair_admin_auth");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed.token || null;
  } catch {
    return null;
  }
}

function buildQuery(params = {}) {
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== "" && v !== "all");
  if (!entries.length) return "";
  return `?${new URLSearchParams(entries).toString()}`;
}

async function request(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const message = data?.message || data?.error || (typeof data === "string" ? data : "Request failed");
    throw new Error(message);
  }
  return data;
}

export const api = {
  login: (email, password) =>
    request("/api/internal/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  forgotPassword: (email) =>
    request("/api/internal/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  changePassword: (currentPassword, newPassword) =>
    request("/api/internal/account/change-password", {
      method: "PATCH",
      body: JSON.stringify({ currentPassword, newPassword }),
    }),

  resetStaffPassword: (id, newPassword) =>
    request(`/api/internal/staff/${id}/reset-password`, {
      method: "PATCH",
      body: JSON.stringify({ newPassword }),
    }),

  getOrganizations: () => request("/api/internal/organizations"),

  createOrganization: (payload) =>
    request("/api/internal/organizations", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateOrgWallet: (organizationId, balance, reason) =>
    request(`/api/internal/organizations/${organizationId}/wallet`, {
      method: "PATCH",
      body: JSON.stringify({ balance, reason }),
    }),

  getStaffUsers: () => request("/api/internal/staff"),

  createStaffUser: (payload) =>
    request("/api/internal/staff", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  toggleStaffActive: (id) =>
    request(`/api/internal/staff/${id}/toggle-active`, { method: "PATCH" }),

  getDashboardStats: () => request("/api/internal/dashboard/stats"),

  getDashboardAnalytics: (from, to) =>
    request(`/api/internal/dashboard/analytics${buildQuery({ from, to })}`),

  getPlatformUsers: (params = {}) =>
    request(`/api/internal/platform-users${buildQuery(params)}`),

  getPlatformUser: (id) => request(`/api/internal/platform-users/${id}`),

  onboardPlatformUser: (payload) =>
    request("/api/internal/platform-users", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getSubscriptions: (params = {}) =>
    request(`/api/internal/subscriptions${buildQuery(params)}`),

  getPayments: (params = {}) =>
    request(`/api/internal/payments${buildQuery(params)}`),

  getDoctorEarnings: (params = {}) =>
    request(`/api/internal/doctor-earnings${buildQuery(params)}`),

  getDoctorEarningsSummary: () => request("/api/internal/doctor-earnings/summary"),

  getComplaints: (params = {}) =>
    request(`/api/internal/complaints${buildQuery(params)}`),

  createComplaint: (payload) =>
    request("/api/internal/complaints", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getComplaintAssignees: () => request("/api/internal/complaints/assignees"),

  getAuditTrail: (params = {}) => request(`/api/internal/audit${buildQuery(params)}`),

  updateComplaint: (id, payload) =>
    request(`/api/internal/complaints/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  getConsultations: (params = {}) =>
    request(`/api/internal/consultations${buildQuery(params)}`),

  getDoctorVerifications: () => request("/api/internal/doctor-verifications"),

  approveDoctor: (id) =>
    request(`/api/internal/doctor-verifications/${id}/approve`, { method: "POST" }),

  rejectDoctor: (id) =>
    request(`/api/internal/doctor-verifications/${id}/reject`, { method: "POST" }),

  getAgents: () => request("/api/internal/agents"),

  getSettings: () => request("/api/internal/settings"),
};

export { API_BASE };