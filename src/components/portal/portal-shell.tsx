import { Menu, Star, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Avatar, AvatarFallback, Button } from "@/components/ui";
import type { PortalNavItem } from "@/config/navigation";
import { useAuth } from "@/context/AuthContext";
import { initialsOf } from "@/lib/format";

/**
 * Shared portal shell.
 *
 * Transcribed from the prototype's Dashboard layout: a fixed `w-64` slate-900
 * sidebar with an emerald logo mark and bordered nav items, a mobile drawer, and
 * a white sticky header carrying the avatar and role label. The technician,
 * customer and admin portals differ only in their nav items and header extras,
 * so the chrome lives here once.
 */
export function PortalShell({
  nav,
  homePath,
  roleLabel,
  headerExtra,
}: {
  nav: PortalNavItem[];
  /** The nav entry that should only match exactly (the portal index route). */
  homePath: string;
  roleLabel: string;
  /** Portal-specific header content, e.g. the technician availability pill. */
  headerExtra?: ReactNode;
}) {
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

  // Legitimate effect: synchronizes an external system (document.body).
  useEffect(() => {
    if (!isDrawerOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isDrawerOpen]);

  const fullName = user ? `${user.FirstName} ${user.LastName}`.trim() : roleLabel;

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-accent bg-sidebar lg:flex">
        <Sidebar nav={nav} homePath={homePath} fullName={fullName} roleLabel={roleLabel} />
      </aside>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-black/50"
            onClick={closeDrawer}
          />
          <aside className="relative flex h-full w-64 flex-col border-r border-accent bg-sidebar shadow-xl">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close navigation"
              className="absolute right-3 top-5 text-slate-400 hover:bg-white/10 hover:text-white"
              onClick={closeDrawer}
            >
              <X />
            </Button>
            <Sidebar nav={nav} homePath={homePath} fullName={fullName} roleLabel={roleLabel} />
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
              onClick={openDrawer}
            >
              <Menu />
            </Button>
            {headerExtra}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-foreground">{fullName}</p>
              <p className="text-xs text-muted-foreground">{roleLabel}</p>
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

function Sidebar({
  nav,
  homePath,
  fullName,
  roleLabel,
}: {
  nav: PortalNavItem[];
  homePath: string;
  fullName: string;
  roleLabel: string;
}) {
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
        {nav.map((item) => (
          <SidebarLink key={item.to} item={item} isHome={item.to === homePath} />
        ))}
      </nav>

      <div className="border-t border-accent p-4">
        <p className="px-3 text-xs text-slate-500">{fullName}</p>
        <p className="px-3 text-xs font-medium text-slate-400">{roleLabel} Portal</p>
      </div>
    </>
  );
}

function SidebarLink({ item, isHome }: { item: PortalNavItem; isHome: boolean }) {
  const Icon = item.icon;

  return (
    <NavLink
      to={item.to}
      end={isHome}
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
          <span className="flex-1 truncate">{item.label}</span>
          {isActive && <span className="size-1.5 rounded-full bg-emerald-500" />}
        </>
      )}
    </NavLink>
  );
}