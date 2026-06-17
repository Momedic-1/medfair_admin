import { STAFF_ROLES } from "../constants/roles";

const VALID_ROLES = new Set(Object.values(STAFF_ROLES));

export function parseStoredSession(raw) {
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (!session?.token || !session?.email || !session?.role) return null;
    if (!VALID_ROLES.has(session.role)) return null;
    return session;
  } catch {
    return null;
  }
}

export function isValidSession(session) {
  return !!parseStoredSession(JSON.stringify(session));
}
