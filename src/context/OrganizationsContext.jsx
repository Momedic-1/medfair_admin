import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "./AuthContext";

const OrganizationsContext = createContext(null);

function mapOrg(org) {
  return {
    id: org.id,
    name: org.name,
    email: org.email,
    phone: org.phone || "",
    slug: org.slug,
    users: org.users ?? 0,
    walletBalance: Number(org.walletBalance ?? 0),
    status: org.status || "active",
    createdAt: org.createdAt,
    canViewPrescriptions: org.canViewPrescriptions ?? false,
    canViewInvestigations: org.canViewInvestigations ?? false,
    adminFullName: org.adminFullName || "",
    adminEmail: org.adminEmail || "",
    portalLoginEnabled: org.portalLoginEnabled ?? false,
  };
}

export function OrganizationsProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const list = await api.getOrganizations();
      setOrganizations(list.map(mapOrg));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addOrganization = async (payload) => {
    const created = await api.createOrganization({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      slug: payload.slug || undefined,
      canViewPrescriptions: payload.canViewPrescriptions ?? false,
      canViewInvestigations: payload.canViewInvestigations ?? false,
      adminFullName: payload.adminFullName,
      adminEmail: payload.adminEmail,
      adminPassword: payload.adminPassword,
    });
    await refresh();
    return mapOrg(created);
  };

  const updateWalletBalance = async (organizationId, balance, reason) => {
    const updated = await api.updateOrgWallet(organizationId, balance, reason);
    setOrganizations((prev) =>
      prev.map((o) => (o.id === organizationId ? mapOrg(updated) : o))
    );
    return mapOrg(updated);
  };

  const value = useMemo(
    () => ({
      organizations,
      loading,
      error,
      refresh,
      addOrganization,
      updateWalletBalance,
    }),
    [organizations, loading, error, refresh]
  );

  return (
    <OrganizationsContext.Provider value={value}>{children}</OrganizationsContext.Provider>
  );
}

export function useOrganizations() {
  const ctx = useContext(OrganizationsContext);
  if (!ctx) throw new Error("useOrganizations must be used within OrganizationsProvider");
  return ctx;
}
