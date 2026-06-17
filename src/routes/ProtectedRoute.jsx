import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { canAccess } from "../constants/navigation";

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-medfair border-t-transparent" />
    </div>
  );
}

export function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return children;
}

export function RoleRoute({ children, path }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingScreen />;

  if (!canAccess(user?.role, path)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
