import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  LayoutDashboard,
  User,
  Wallet,
  Wrench,
} from "lucide-react";

export interface PortalNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /**
   * The Service Requests item carries an unread/deferred count badge in the
   * prototype. Wired to the pending job-request count by the layout, which is
   * the only page that knows that number.
   */
  badgeKey?: "pendingRequests";
}

export const TECHNICIAN_NAV: PortalNavItem[] = [
  { label: "Dashboard", to: "/technician", icon: LayoutDashboard },
  { label: "Service Requests", to: "/technician/requests", icon: ClipboardList, badgeKey: "pendingRequests" },
  { label: "Active Jobs", to: "/technician/jobs", icon: Wrench },
  { label: "My Schedule", to: "/technician/schedule", icon: CalendarDays },
  { label: "Earnings", to: "/technician/earnings", icon: Wallet },
  { label: "Profile", to: "/technician/profile", icon: User },
];

/** Admin portal navigation, kept next to the technician set so both stay aligned. */
export const ADMIN_NAV: PortalNavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Users", to: "/admin/users", icon: User },
  { label: "Bookings", to: "/admin/bookings", icon: ClipboardList },
];

export const CUSTOMER_NAV: PortalNavItem[] = [
  { label: "Home", to: "/customer", icon: LayoutDashboard },
  { label: "Book a Service", to: "/customer/book", icon: CalendarPlus },
  { label: "My Bookings", to: "/customer/bookings", icon: ClipboardList },
  { label: "Profile", to: "/customer/profile", icon: User },
];