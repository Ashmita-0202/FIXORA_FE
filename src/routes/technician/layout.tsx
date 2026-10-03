import { PortalShell } from "@/components/portal/portal-shell";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui";
import { TECHNICIAN_NAV } from "@/config/navigation";
import { useAuth } from "@/context/AuthContext";
import { TechnicianApprovalStatus } from "@/types/enums";

/**
 * Technician portal routes.
 *
 * All the chrome lives in PortalShell; this layer only supplies the technician
 * nav set and the availability pill.
 */
export function TechnicianLayout() {
  return (
    <PortalShell
      nav={TECHNICIAN_NAV}
      homePath="/technician"
      roleLabel="Technician"
      headerExtra={<AvailabilityPill />}
    />
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