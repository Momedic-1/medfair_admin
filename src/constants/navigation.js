import {
  LayoutDashboard,
  Users,
  UserCog,
  CreditCard,
  Wallet,
  MessageSquareWarning,
  CalendarDays,
  Stethoscope,
  Building2,
  Share2,
  ScrollText,
  Settings,
  UserPlus,
} from "lucide-react";
import { STAFF_ROLES } from "./roles";

export const NAV_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    path: "/dashboard",
    icon: LayoutDashboard,
    roles: Object.values(STAFF_ROLES),
  },
  {
    id: "platform-users",
    label: "Platform Users",
    path: "/platform-users",
    icon: Users,
    roles: [
      STAFF_ROLES.SUPER_ADMIN,
      STAFF_ROLES.CUSTOMER_SERVICE,
      STAFF_ROLES.CLINICAL_OPS,
      STAFF_ROLES.OPERATIONS,
      STAFF_ROLES.FINANCE,
    ],
  },
  {
    id: "onboard-user",
    label: "Onboard Patient / Doctor",
    path: "/onboard-user",
    icon: UserPlus,
    roles: [STAFF_ROLES.SUPER_ADMIN],
  },
  {
    id: "staff-users",
    label: "Staff Users",
    path: "/staff-users",
    icon: UserCog,
    roles: [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.TECHNICAL],
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    path: "/subscriptions",
    icon: CreditCard,
    roles: [
      STAFF_ROLES.SUPER_ADMIN,
      STAFF_ROLES.FINANCE,
      STAFF_ROLES.CUSTOMER_SERVICE,
      STAFF_ROLES.OPERATIONS,
    ],
  },
  {
    id: "doctor-earnings",
    label: "Doctor Earnings",
    path: "/doctor-earnings",
    icon: Wallet,
    roles: [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.FINANCE],
  },
  {
    id: "payments",
    label: "Payments & Revenue",
    path: "/payments",
    icon: CreditCard,
    roles: [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.FINANCE, STAFF_ROLES.OPERATIONS],
  },
  {
    id: "complaints",
    label: "Complaints",
    path: "/complaints",
    icon: MessageSquareWarning,
    roles: [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.CUSTOMER_SERVICE],
  },
  {
    id: "consultations",
    label: "Consultations",
    path: "/consultations",
    icon: CalendarDays,
    roles: [
      STAFF_ROLES.SUPER_ADMIN,
      STAFF_ROLES.CUSTOMER_SERVICE,
      STAFF_ROLES.CLINICAL_OPS,
      STAFF_ROLES.OPERATIONS,
      STAFF_ROLES.FINANCE,
    ],
  },
  {
    id: "doctor-verification",
    label: "Doctor Verification",
    path: "/doctor-verification",
    icon: Stethoscope,
    roles: [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.CLINICAL_OPS, STAFF_ROLES.OPERATIONS],
  },
  {
    id: "organizations",
    label: "Organizations",
    path: "/organizations",
    icon: Building2,
    roles: [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.OPERATIONS, STAFF_ROLES.FINANCE],
  },
  {
    id: "agents",
    label: "Referral Agents",
    path: "/agents",
    icon: Share2,
    roles: [STAFF_ROLES.SUPER_ADMIN, STAFF_ROLES.OPERATIONS, STAFF_ROLES.FINANCE],
  },
  {
    id: "audit-trail",
    label: "Audit Trail",
    path: "/audit-trail",
    icon: ScrollText,
    roles: [STAFF_ROLES.SUPER_ADMIN],
  },
  {
    id: "settings",
    label: "Settings",
    path: "/settings",
    icon: Settings,
    roles: [
      STAFF_ROLES.SUPER_ADMIN,
      STAFF_ROLES.FINANCE,
      STAFF_ROLES.CUSTOMER_SERVICE,
      STAFF_ROLES.CLINICAL_OPS,
      STAFF_ROLES.OPERATIONS,
      STAFF_ROLES.TECHNICAL,
    ],
  },
];

export function getNavForRole(role) {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function canAccess(role, path) {
  const item = NAV_ITEMS.find((nav) => nav.path === path);
  if (!item) return true;
  return item.roles.includes(role);
}
