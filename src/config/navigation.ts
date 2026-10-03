import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  LayoutDashboard,
  Tag,
  User,
  UserCheck,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";
import type { ReactNode } from "react";

export interface PortalNavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  /**
   * Optional badge rendered at the end of the nav item. The portal layout owns
   * the counts, so it supplies this per render rather than the nav config —
   * counts live in API responses, not in static navigation.
   */
  badge?: ReactNode;
}

export const TECHNICIAN_NAV: PortalNavItem[] = [
  { label: "Dashboard", to: "/technician", icon: LayoutDashboard },
  { label: "Service Requests", to: "/technician/requests", icon: ClipboardList },
  { label: "Active Jobs", to: "/technician/jobs", icon: Wrench },
  { label: "My Schedule", to: "/technician/schedule", icon: CalendarDays },
  { label: "Earnings", to: "/technician/earnings", icon: Wallet },
  { label: "Profile", to: "/technician/profile", icon: User },
];

export const ADMIN_NAV: PortalNavItem[] = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Applications", to: "/admin/applications", icon: UserCheck },
  { label: "Technicians", to: "/admin/technicians", icon: Wrench },
  { label: "Bookings", to: "/admin/bookings", icon: ClipboardList },
  { label: "Customers", to: "/admin/customers", icon: Users },
  { label: "Services", to: "/admin/services", icon: Tag },
];

export const CUSTOMER_NAV: PortalNavItem[] = [
  { label: "Home", to: "/customer", icon: LayoutDashboard },
  { label: "Book a Service", to: "/customer/book", icon: CalendarPlus },
  { label: "My Bookings", to: "/customer/bookings", icon: ClipboardList },
  { label: "Profile", to: "/customer/profile", icon: User },
];