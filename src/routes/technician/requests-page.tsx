import { useCallback, useState } from "react";
import { Check, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { useApiData, useMutation } from "@/hooks/useApiData";
import { Link } from "react-router-dom";
import { acceptJob, getJobRequests } from "@/services/bookings.service";
import { useAuth } from "@/context/AuthContext";
import { TechnicianApprovalStatus } from "@/types/enums";
import { JobRow } from "./job-row";

/**
 * Service Requests — the unassigned job queue.
 *
 * Accept is the only action available: the API exposes no technician-side decline
 * (Booking/{id}/cancel is customer-initiated), so an unwanted request is simply
 * left for another technician or expires unassigned.
 *
 * The whole page is blocked for technicians who are not Approved and active,
 * because the API would reject every accept with 403 — the UI says so up front
 * instead of letting the user discover it by clicking.
 */
export function TechnicianRequestsPage() {
  const { user } = useAuth();
  const [acceptedId, setAcceptedId] = useState<string | null>(null);

  const canAccept =
    user?.TechnicianApprovalStatus == null ||
    user.TechnicianApprovalStatus === TechnicianApprovalStatus.Approved;
  const isActive = user?.TechnicianIsActive !== false;
  const isEligible = canAccept && isActive;

  const loader = useCallback(() => getJobRequests(), []);
  const { data, isLoading, error, refetch, setData } = useApiData(
    loader,
    [],
    { enabled: isEligible },
  );

  const accept = useMutation(async (bookingId: string) => {
    const updated = await acceptJob(bookingId);
    // Remove from the queue locally so the list reacts immediately, then re-sync.
    setData((current) => current?.filter((booking) => booking.Id !== bookingId) ?? current);
    void refetch();
    return updated;
  });

  const handleAccept = async (bookingId: string) => {
    setAcceptedId(bookingId);
    const updated = await accept.mutate(bookingId);
    if (updated) {
      toast.success("Job accepted", {
        description: "It now appears under Active Jobs.",
      });
    }
    setAcceptedId(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          Service Requests
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Unassigned jobs matching your services, earliest first.
        </p>
      </div>

      {!isEligible && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Job requests are unavailable until an admin approves and activates your
          technician profile. Your current status is shown on your{" "}
          <Link to="/technician/profile" className="font-semibold underline">
            profile page
          </Link>
          .
        </div>
      )}

      {accept.error && <ErrorState message={accept.error} onRetry={() => accept.reset()} />}

      {error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : !isEligible ? null : (data ?? []).length === 0 ? (
        <EmptyState
          title="No open requests"
          description="New jobs will appear here as soon as customers book them."
          icon={<ClipboardList className="size-6" />}
        />
      ) : (
        <div className="space-y-3">
          {(data ?? []).map((booking) => (
            <JobRow
              key={booking.Id}
              booking={booking}
              actions={
                <Button
                  size="sm"
                  disabled={accept.isPending}
                  onClick={() => void handleAccept(booking.Id)}
                >
                  <Check />
                  {acceptedId === booking.Id ? "Accepting…" : "Accept job"}
                </Button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}