import { Menu, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, Button, Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";
import { TECHNICIAN_NAV } from "@/config/navigation";
import { useAuth } from "@/context/AuthContext";
import { initialsOf } from "@/lib/format";
import { TechnicianApprovalStatus } from "@/types/enums";

/**
 * Technician portal shell.
 *
 * Transcribed from the prototype's Dashboard layout: a fixed `w-64` slate-900
 * sidebar with an emerald logo mark and bordered nav items, a mobile drawer, and
 * a white header carrying the availability pill and avatar.
 *
 * The prototype hardcodes "Ram Shrestha" and "Available" — here both come from
 * the session and from the technician's real approval state, since a Pending or
 * Rejected technician cannot accept work and must not appear available.
 */
export function TechnicianLayout() {
  const { user } = useAuth();
  const location = useLocation();

  /**
   * The drawer is keyed by the path it was opened on rather than held as a plain
   * boolean, so navigating away closes it as a consequence of the route change
   * instead of needing an effect to reset it.
   */
  const [drawerOpenedAt, setDrawerOpenedAt] = useState<string | null>(null);
  const isDrawerOpen = drawerOpenedAt !== null && drawerOpenedAt === location.pathname;

  const openDrawer = () => setDrawerOpenedAt(location.pathname);
  const closeDrawer = () => setDrawerOpenedAt(null);

  // Prevent the page behind the drawer from scrolling while it is open. This is
  // a legitimate effect: it synchronizes an external system (document.body).
  useEffect(() => {
    if (!isDrawerOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  const fullName = user ? `${user.FirstName} ${user.LastName}`.trim() : "Technician";

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-accent bg-sidebar lg:flex">
        <SidebarContent fullName={fullName} />
      </aside>

      {/* Mobile drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/50"
            onClick={() => closeDrawer()}
          />
          <aside className="relative flex h-full w-64 flex-col border-r border-accent bg-sidebar shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close navigation"
              className="absolute right-3 top-5 text-slate-400 hover:bg-white/10 hover:text-white"
              onClick={() => closeDrawer()}
            >
              <X />
            </Button>
            <SidebarContent fullName={fullName} />
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-background px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open navigation"
              className="lg:hidden"
              onClick={() => openDrawer()}
            >
              <Menu />
            </Button>
            <AvailabilityPill />
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-foreground">{fullName}</p>
              <p className="text-xs text-muted-foreground">Technician</p>
            </div>
            <Avatar>
              <AvatarFallback>{initialsOf(fullName)}</AvatarFallback>
            </Avatar>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function SidebarContent({ fullName }: { fullName: string }) {
  return (
    <>
      <div className="flex h-16 items-center gap-2 border-b border-accent px-6">
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-600">
          <Star className="size-5 text-white" fill="currentColor" />
        </div>
        <span className="font-display text-lg font-extrabold tracking-tight text-white">
          Fixora
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {TECHNICIAN_NAV.map((item) => (
          <SidebarLink key={item.to} {...item} />
        ))}
      </nav>

      <div className="border-t border-accent p-4">
        <p className="px-3 text-xs text-slate-500">{fullName}</p>
        <p className="px-3 text-xs font-medium text-slate-400">Technician Portal</p>
      </div>
    </>
  );
}

function SidebarLink({ label, to, icon: Icon }: (typeof TECHNICIAN_NAV)[number]) {
  return (
    <NavLink
      to={to}
      end={to === "/technician"}
      className={({ isActive }) =>
        [
          "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors",
          isActive
            ? "border-accent bg-white/10 text-white"
            : "border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-100",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <Icon className="size-4 shrink-0" />
          <span className="flex-1 truncate">{label}</span>
          {isActive && <span className="size-1.5 rounded-full bg-emerald-500" />}
        </>
      )}
    </NavLink>
  );
}

/**
 * Availability is derived from the approval state on the login response rather
 * than fetched, so it renders before any profile request resolves. A technician
 * who has not been approved cannot accept jobs, so claiming availability would be
 * misleading — the pill then reflects their real status.
 */
function AvailabilityPill() {
  const { user } = useAuth();

  if (!user) return null;

  const isApproved =
    user.TechnicianApprovalStatus == null ||
    user.TechnicianApprovalStatus === TechnicianApprovalStatus.Approved;

  const isActive = user.TechnicianIsActive !== false;
  const isAvailable = isApproved && isActive;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={[
            "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
            isAvailable
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700",
          ].join(" ")}
        >
          <span
            className={[
              "size-2 rounded-full",
              isAvailable ? "bg-emerald-500" : "bg-amber-500",
            ].join(" ")}
          />
          {isAvailable ? "Available" : "Unavailable"}
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {isAvailable
          ? "You are listed as available for new job requests."
          : "New job requests will not appear until an admin approves and activates your profile."}
      </TooltipContent>
    </Tooltip>
  );
}