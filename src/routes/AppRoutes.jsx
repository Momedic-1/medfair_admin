import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute, GuestRoute, RoleRoute } from "./ProtectedRoute";
import { AdminLayout } from "../components/layout/AdminLayout";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import PlatformUsersPage from "../pages/PlatformUsersPage";
import StaffUsersPage from "../pages/StaffUsersPage";
import OnboardUserPage from "../pages/OnboardUserPage";
import SubscriptionsPage from "../pages/SubscriptionsPage";
import DoctorEarningsPage from "../pages/DoctorEarningsPage";
import ComplaintsPage from "../pages/ComplaintsPage";
import PaymentsPage from "../pages/PaymentsPage";
import ConsultationsPage from "../pages/ConsultationsPage";
import DoctorVerificationPage from "../pages/DoctorVerificationPage";
import OrganizationsPage from "../pages/OrganizationsPage";
import AgentsPage from "../pages/AgentsPage";
import SettingsPage from "../pages/SettingsPage";
import AuditTrailPage from "../pages/AuditTrailPage";

function withRole(path, element) {
  return <RoleRoute path={path}>{element}</RoleRoute>;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="platform-users" element={withRole("/platform-users", <PlatformUsersPage />)} />
        <Route path="onboard-user" element={withRole("/onboard-user", <OnboardUserPage />)} />
        <Route path="staff-users" element={withRole("/staff-users", <StaffUsersPage />)} />
        <Route path="subscriptions" element={withRole("/subscriptions", <SubscriptionsPage />)} />
        <Route path="doctor-earnings" element={withRole("/doctor-earnings", <DoctorEarningsPage />)} />
        <Route path="payments" element={withRole("/payments", <PaymentsPage />)} />
        <Route path="complaints" element={withRole("/complaints", <ComplaintsPage />)} />
        <Route path="consultations" element={withRole("/consultations", <ConsultationsPage />)} />
        <Route path="doctor-verification" element={withRole("/doctor-verification", <DoctorVerificationPage />)} />
        <Route path="organizations" element={withRole("/organizations", <OrganizationsPage />)} />
        <Route path="agents" element={withRole("/agents", <AgentsPage />)} />
        <Route path="audit-trail" element={withRole("/audit-trail", <AuditTrailPage />)} />
        <Route path="settings" element={withRole("/settings", <SettingsPage />)} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
