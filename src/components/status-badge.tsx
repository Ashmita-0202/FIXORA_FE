import { Badge } from "@/components/ui";
import type { BadgeProps } from "@/components/ui/badge";
import { BookingStatus, TechnicianApprovalStatus } from "@/types/enums";

/**
 * Maps API statuses onto badge variants.
 *
 * Each status also gets a label: the API sends "InProgress" but the prototype
 * renders "In Progress", so the split happens here rather than at every use.
 */

type BadgeVariant = NonNullable<BadgeProps["variant"]>;

const BOOKING_BADGE: Record<BookingStatus, { variant: BadgeVariant; label: string }> = {
  [BookingStatus.Pending]: { variant: "pending", label: "Pending" },
  [BookingStatus.Scheduled]: { variant: "scheduled", label: "Scheduled" },
  [BookingStatus.InProgress]: { variant: "inProgress", label: "In Progress" },
  [BookingStatus.Completed]: { variant: "completed", label: "Completed" },
  [BookingStatus.Cancelled]: { variant: "cancelled", label: "Cancelled" },
};

const APPROVAL_BADGE: Record<
  TechnicianApprovalStatus,
  { variant: BadgeVariant; label: string }
> = {
  [TechnicianApprovalStatus.Pending]: { variant: "pending", label: "Pending" },
  [TechnicianApprovalStatus.Approved]: { variant: "approved", label: "Approved" },
  [TechnicianApprovalStatus.Rejected]: { variant: "rejected", label: "Rejected" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const config = BOOKING_BADGE[status] ?? { variant: "neutral" as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function ApprovalStatusBadge({ status }: { status: TechnicianApprovalStatus }) {
  const config = APPROVAL_BADGE[status] ?? { variant: "neutral" as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

/**
 * Status as display text, for places that need the label outside a badge —
 * filter dropdowns, dialog buttons ("Mark completed"), confirmation copy.
 * Keeping it beside the badge map means "InProgress" is only spelled once.
 */
export function bookingStatusLabel(status: BookingStatus): string {
  return BOOKING_BADGE[status]?.label ?? status;
}

export function approvalStatusLabel(status: TechnicianApprovalStatus): string {
  return APPROVAL_BADGE[status]?.label ?? status;
}