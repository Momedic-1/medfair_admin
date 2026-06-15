import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);
const STORAGE_KEY = "medfair_admin_auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [staffUsers, setStaffUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    const session = {
      id: res.id,
      fullName: res.fullName,
      email: res.email,
      role: res.role,
      token: res.token,
    };
    setUser(session);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return session;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const refreshStaffUsers = async () => {
    if (!["SUPER_ADMIN", "TECHNICAL"].includes(user?.role)) return;
    const result = await api.getStaffUsers({ page: 1, pageSize: 20 });
    setStaffUsers(result.items || []);
  };

  useEffect(() => {
    if (["SUPER_ADMIN", "TECHNICAL"].includes(user?.role)) {
      refreshStaffUsers().catch(() => setStaffUsers([]));
    }
  }, [user?.role]);

  const createStaffUser = async (payload) => {
    const created = await api.createStaffUser({
      fullName: payload.fullName,
      email: payload.email,
      password: payload.password,
      role: payload.role,
    });
    await refreshStaffUsers();
    return created;
  };

  const toggleStaffActive = async (id) => {
    await api.toggleStaffActive(id);
    await refreshStaffUsers();
  };

  const resetStaffPassword = async (id, newPassword) => {
    await api.resetStaffPassword(id, newPassword);
    await refreshStaffUsers();
  };

  const value = useMemo(
    () => ({
      user,
      loading,
      staffUsers,
      login,
      logout,
      createStaffUser,
      toggleStaffActive,
      resetStaffPassword,
      refreshStaffUsers,
      isAuthenticated: !!user,
    }),
    [user, loading, staffUsers]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
