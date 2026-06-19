import { STAFF_ROLES } from "../constants/roles";

const VALID_ROLES = new Set(Object.values(STAFF_ROLES));

function decodeJwtPayload(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return false;
  return Date.now() >= payload.exp * 1000;
}

export function getTokenExpiryMs(token) {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return null;
  return payload.exp * 1000;
}

export function parseStoredSession(raw) {
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (!session?.token || !session?.email || !session?.role) return null;
    if (!VALID_ROLES.has(session.role)) return null;
    if (isTokenExpired(session.token)) return null;
    return session;
  } catch {
    return null;
  }
}

export function isValidSession(session) {
  return !!parseStoredSession(JSON.stringify(session));
}
