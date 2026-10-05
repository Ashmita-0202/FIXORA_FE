import { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { PortalShell } from "@/components/portal/portal-shell";
import { ADMIN_NAV } from "@/config/navigation";
import { useApiData } from "@/hooks/useApiData";
import { getPendingApplications } from "@/services/technicians.service";

/**
 * Admin portal routes.
 *
 * The Applications item carries a count badge, which is the one number an admin
 * needs at a glance on every page — so it is fetched here, once, rather than
 * repeated on each screen. The list endpoint is small (application summaries
 * only) and the request is not polled, so a stale count self-corrects on
 * navigation.
 */
export function AdminLayout() {
  const { pathname } = useLocation();
  const loader = useCallback(() => getPendingApplications(), []);
  const { data } = useApiData(loader, [pathname]);

  const pendingCount = data?.length ?? 0;

  const nav = ADMIN_NAV.map((item) =>
    item.to === "/admin/applications" && pendingCount > 0
      ? {
          ...item,
          badge: (
            <span className="flex size-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white">
              {pendingCount}
            </span>
          ),
        }
      : item,
  );

  return <PortalShell nav={nav} homePath="/admin" roleLabel="Admin" />;
}