import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Badge — the status pill used throughout the portal.
 *
 * Base class string is transcribed from the prototype's Badge component in
 * App.tsx. The variant set covers all five BookingStatus values plus the
 * technician approval statuses and generic informational states.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        /* BookingStatus */
        pending: "bg-amber-100 text-amber-700 border border-amber-200",
        scheduled: "bg-purple-100 text-purple-700 border border-purple-200",
        inProgress: "bg-blue-100 text-blue-700 border border-blue-200",
        completed: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        cancelled: "bg-red-100 text-red-700 border border-red-200",

        /* TechnicianApprovalStatus */
        approved: "bg-emerald-100 text-emerald-700 border border-emerald-200",
        rejected: "bg-red-100 text-red-700 border border-red-200",

        neutral: "bg-slate-100 text-slate-700 border border-slate-200",
        outline: "border border-slate-200 text-slate-600",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { badgeVariants };