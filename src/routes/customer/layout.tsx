import { PortalShell } from "@/components/portal/portal-shell";
import { CUSTOMER_NAV } from "@/config/navigation";

/** Customer portal routes. */
export function CustomerLayout() {
  return <PortalShell nav={CUSTOMER_NAV} homePath="/customer" roleLabel="Customer" />;
}