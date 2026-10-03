import { useState } from "react";
import { Award, Building2, Mail, Phone, Star, UserCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Textarea,
} from "@/components/ui";
import { ApprovalStatusBadge } from "@/components/status-badge";
import { useMutation } from "@/hooks/useApiData";
import { formatDate, initialsOf } from "@/lib/format";
import { approveTechnician, rejectTechnician } from "@/services/technicians.service";
import type { Technician } from "@/types/api";
import { TechnicianApprovalStatus } from "@/types/enums";

/**
 * Review actions for a technician application.
 *
 * CRITICAL: both calls take `Technician.Id`, which is the TechnicianProfile id —
 * NOT `Technician.UserId`. Passing the User id resolves to a different row, so
 * the action would appear to succeed while affecting the wrong technician.
 */
export function ApplicationActions({
  technician,
  onSettled,
}: {
  technician: Technician;
  /** Runs after either action succeeds, so the list can drop the application. */
  onSettled: () => void;
}) {
  const approve = useMutation(async () => {
    await approveTechnician(technician.Id);
    toast.success(`${technician.Name} approved`, {
      description: "Their profile is now visible to customers.",
    });
    onSettled();
  });

  const reject = useMutation(async (reason: string) => {
    await rejectTechnician(technician.Id, reason);
    toast.success(`${technician.Name} rejected`, {
      description: "They will see the reason on their profile.",
    });
    onSettled();
  });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {approve.error && (
        <span className="text-xs font-medium text-red-600">{approve.error}</span>
      )}

      <RejectDialog
        technician={technician}
        isPending={reject.isPending}
        onConfirm={(reason) => reject.mutate(reason)}
      />

      <Button
        size="sm"
        disabled={approve.isPending || reject.isPending}
        onClick={() => void approve.mutate()}
      >
        <UserCheck />
        {approve.isPending ? "Approving…" : "Approve"}
      </Button>
    </div>
  );
}

/**
 * Rejection requires a reason, because the API stores it on the profile and
 * surfaces it to the applicant. It is optional server-side, so requiring it here
 * is a UX decision — an unexplained rejection is useless to the applicant.
 */
function RejectDialog({
  technician,
  isPending,
  onConfirm,
}: {
  technician: Technician;
  isPending: boolean;
  onConfirm: (reason: string) => Promise<unknown>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setReason("");
      setLocalError(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 hover:bg-red-50">
          Reject
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject {technician.Name}'s application?</DialogTitle>
          <DialogDescription>
            The applicant sees this reason on their profile, so be specific.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-1.5">
          <label htmlFor="reject-reason" className="text-sm font-medium text-slate-700">
            Reason
          </label>
          <Textarea
            id="reject-reason"
            rows={3}
            value={reason}
            placeholder="e.g. Certification could not be verified"
            onChange={(event) => {
              setReason(event.target.value);
              setLocalError(null);
            }}
          />
          {localError && <p className="text-xs font-medium text-red-600">{localError}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={isPending}
            onClick={async () => {
              if (!reason.trim()) {
                setLocalError("Please give a reason for the rejection.");
                return;
              }
              // useMutation resolves null on failure, so the dialog stays open and
              // the page-level error remains visible.
              const result = await onConfirm(reason.trim());
              if (result !== null) handleOpenChange(false);
            }}
          >
            {isPending ? "Rejecting…" : "Reject application"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Technician summary card, shared by the applications and technicians lists. */
export function TechnicianCard({
  technician,
  actions,
}: {
  technician: Technician;
  actions?: React.ReactNode;
}) {
  const isApprovedButInactive =
    !technician.IsActive && technician.ApprovalStatus === TechnicianApprovalStatus.Approved;

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
        <div className="flex min-w-0 gap-3">
          <Avatar className="size-11">
            <AvatarFallback>{initialsOf(technician.Name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-foreground">{technician.Name}</h3>
              <ApprovalStatusBadge status={technician.ApprovalStatus} />
              {isApprovedButInactive && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                  Deactivated
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground">{technician.Specialty}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="size-3.5" />
                {technician.Email}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Phone className="size-3.5" />
                {technician.Phone}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Building2 className="size-3.5" />
                {technician.City}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Award className="size-3.5" />
                {technician.ExperienceYears} yr
                {technician.ExperienceYears === 1 ? "" : "s"}
              </span>
            </div>

            {technician.Certification && (
              <p className="text-xs text-slate-600">{technician.Certification}</p>
            )}

            {technician.RejectionReason && (
              <p className="rounded-md bg-red-50 px-2.5 py-1.5 text-xs text-red-800">
                Rejected: {technician.RejectionReason}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Applied {formatDate(technician.AppliedAt)}
              {technician.JobsCompleted > 0 && (
                <>
                  {" · "}
                  {technician.JobsCompleted} job
                  {technician.JobsCompleted === 1 ? "" : "s"} completed
                </>
              )}
              {technician.ReviewCount > 0 && (
                <>
                  {" · "}
                  <Star className="inline size-3 fill-amber-400 text-amber-400" />{" "}
                  {technician.AverageRating.toFixed(1)} ({technician.ReviewCount})
                </>
              )}
            </p>
          </div>
        </div>

        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </CardContent>
    </Card>
  );
}