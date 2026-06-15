import { useEffect, useMemo, useState } from "react";
import {
  Users,
  CreditCard,
  Stethoscope,
  MessageSquareWarning,
  CalendarDays,
  Wallet,
  Building2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { StatCard } from "../components/ui/StatCard";
import { DashboardChartCard } from "../components/ui/DashboardChartCard";
import { formatNaira } from "../utils/format";
import { StatusBadge } from "../components/ui/Badge";
import { ROLE_LABELS, STAFF_ROLES } from "../constants/roles";
import { api, API_BASE } from "../api/client";

export default function DashboardPage() {
  const { user, isAuthenticated } = useAuth();
  const role = user?.role;
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");

      const results = await Promise.allSettled([
        api.getDashboardStats(),
        api.getDashboardAnalytics(),
        api.getComplaints({ status: "open", limit: 3 }),
        api.getConsultations({ limit: 3 }),
      ]);

      if (cancelled) return;

      const [statsRes, analyticsRes, complaintsRes, consultationsRes] = results;
      const errors = [];

      if (statsRes.status === "fulfilled") {
        setStats(statsRes.value);
      } else {
        setStats(null);
        errors.push("stats");
      }

      if (analyticsRes.status === "fulfilled") {
        setAnalytics(analyticsRes.value);
      } else {
        setAnalytics([]);
        errors.push("analytics");
      }

      if (complaintsRes.status === "fulfilled") {
        setComplaints(complaintsRes.value);
      } else {
        setComplaints([]);
      }

      if (consultationsRes.status === "fulfilled") {
        setConsultations(consultationsRes.value);
      } else {
        setConsultations([]);
      }

      if (errors.length) {
        const detail = statsRes.status === "rejected" ? statsRes.reason?.message : null;
        setError(
          detail
            ? `Could not load dashboard ${errors.join(" and ")}: ${detail}`
            : `Could not load dashboard ${errors.join(" and ")}. Check that the API is reachable at ${API_BASE}.`
        );
      }

      setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [isAuthenticated]);

  const statCards = [
    { title: "Total Users", value: stats?.totalUsers?.toLocaleString() ?? "—", icon: Users, accent: "primary", roles: Object.values(STAFF_ROLES) },
    { title: "Active Subscriptions", value: stats?.subscribedUsers?.toLocaleString() ?? "—", icon: CreditCard, accent: "green", roles: [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.FINANCE, STAFF_ROLES.OPERATIONS, STAFF_ROLES.CUSTOMER_SERVICE] },
    { title: "Active Doctors", value: stats?.activeDoctors ?? "—", icon: Stethoscope, accent: "primary", roles: [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.CLINICAL_OPS, STAFF_ROLES.OPERATIONS] },
    { title: "Open Complaints", value: stats?.openComplaints ?? "—", icon: MessageSquareWarning, accent: "rose", roles: [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.CUSTOMER_SERVICE] },
    { title: "Today's Consultations", value: stats?.todayConsultations ?? "—", icon: CalendarDays, accent: "primary", roles: [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.CUSTOMER_SERVICE, STAFF_ROLES.CLINICAL_OPS, STAFF_ROLES.OPERATIONS] },
    { title: "Monthly Revenue", value: stats ? formatNaira(Number(stats.monthlyRevenue)) : "—", icon: Wallet, accent: "green", roles: [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.FINANCE, STAFF_ROLES.OPERATIONS] },
    { title: "Pending Verifications", value: stats?.pendingVerifications ?? "—", icon: AlertCircle, accent: "amber", roles: [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.CLINICAL_OPS, STAFF_ROLES.OPERATIONS] },
    { title: "Partner Orgs", value: stats?.orgPartners ?? "—", icon: Building2, accent: "amber", roles: [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.OPERATIONS, STAFF_ROLES.FINANCE] },
  ].filter((s) => s.roles.includes(role));

  const showRevenueChart = [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.FINANCE, STAFF_ROLES.OPERATIONS].includes(role);
  const recentComplaints = useMemo(() => complaints.filter((c) => c.status !== "resolved").slice(0, 3), [complaints]);
  const recentConsultations = consultations.slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-medfair">Welcome back, {user?.fullName?.split(" ")[0]}</h1>
        <p className="mt-1 text-sm text-slate-500">Signed in as {ROLE_LABELS[role]}</p>
        {loading && <p className="mt-2 text-sm text-slate-400">Loading dashboard data...</p>}
        {error && <p className="mt-2 text-sm text-amber-700">{error}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.slice(0, 4).map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Analytics</h2>
        <div className={`grid gap-6 ${showRevenueChart ? "xl:grid-cols-2" : ""}`}>
          <DashboardChartCard
            title="New User Registrations"
            description="Patients and doctors onboarded per month"
            dataKey="newUsers"
            accent="blue"
            series={analytics}
          />
          {showRevenueChart && (
            <DashboardChartCard
              title="Monthly Revenue"
              description="Total platform revenue per month (NGN)"
              dataKey="revenue"
              accent="green"
              formatTotalValue={(v) => formatNaira(v)}
              series={analytics}
            />
          )}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-slate-400">Recent Activity</h2>
        <div className="grid gap-6 lg:grid-cols-2">
          {(role === STAFF_ROLES.SUPER_ADMIN || role === STAFF_ROLES.CUSTOMER_SERVICE) && (
            <div className="card">
              <h3 className="mb-4 font-semibold text-slate-800">Recent Complaints</h3>
              <div className="space-y-3">
                {recentComplaints.length === 0 ? (
                  <p className="text-sm text-slate-400">No open complaints</p>
                ) : (
                  recentComplaints.map((c) => (
                    <div key={c.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{c.subject}</p>
                        <p className="text-xs text-slate-500">{c.userName}</p>
                      </div>
                      <StatusBadge status={c.status} />
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className={`card ${!(role === STAFF_ROLES.SUPER_ADMIN || role === STAFF_ROLES.CUSTOMER_SERVICE) ? "lg:col-span-2" : ""}`}>
            <h3 className="mb-4 font-semibold text-slate-800">Recent Consultations</h3>
            <div className="space-y-3">
              {recentConsultations.length === 0 ? (
                <p className="text-sm text-slate-400">No recent consultations</p>
              ) : (
                recentConsultations.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-3 rounded-xl border border-slate-100 p-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {c.patientName} → {c.doctorName}
                      </p>
                      <p className="text-xs text-slate-500">
                        {c.type} · {c.date} {c.time}
                      </p>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
