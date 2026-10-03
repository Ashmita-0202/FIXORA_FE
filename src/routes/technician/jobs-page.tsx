import { useCallback, useMemo, useState } from "react";
import { CheckCircle2, PlayCircle, Wrench } from "lucide-react";
import { toast } from "sonner";
import { Button, Tabs, TabsList, TabsTrigger } from "@/components/ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { useApiData, useMutation } from "@/hooks/useApiData";
import { getMyJobs, updateJobStatus } from "@/services/bookings.service";
import type { Booking } from "@/types/api";
import { BookingStatus } from "@/types/enums";
import { JobRow } from "./job-row";

type Filter = "active" | "completed" | "all";

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All" },
];

/**
 * Active Jobs.
 *
 * Status buttons are derived from BOOKING_STATUS_TRANSITIONS rather than
 * hardcoded per status, so the UI can only ever offer a transition the API
 * permits — Scheduled offers "Start job" and InProgress offers "Mark complete",
 * nothing else.
 */
export function TechnicianJobsPage() {
  const [filter, setFilter] = useState<Filter>("active");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const loader = useCallback(() => getMyJobs(), []);
  const { data, isLoading, error, refetch, setData } = useApiData<Booking[]>(loader, []);

  const advance = useMutation(async (bookingId: string, next: BookingStatus) => {
    const updated = await updateJobStatus(bookingId, next);
    setData((current) =>
      current?.map((booking) => (booking.Id === bookingId ? updated : booking)) ?? current,
    );
    return updated;
  });

  const jobs = useMemo(() => {
    if (!data) return [];
    if (filter === "active") {
      return data.filter(
        (booking) =>
          booking.Status === BookingStatus.Scheduled ||
          booking.Status === BookingStatus.InProgress,
      );
    }
    if (filter === "completed") {
      return data.filter((booking) => booking.Status === BookingStatus.Completed);
    }
    return data;
  }, [data, filter]);

  const handleAdvance = async (booking: Booking) => {
    const next =
      booking.Status === BookingStatus.Scheduled
        ? BookingStatus.InProgress
        : BookingStatus.Completed;

    setPendingId(booking.Id);
    const updated = await advance.mutate(booking.Id, next);
    if (updated) {
      toast.success(
        next === BookingStatus.InProgress ? "Job started" : "Job completed",
        {
          description:
            next === BookingStatus.Completed
              ? `${updated.ServiceName} has been marked complete.`
              : `${updated.ServiceName} is now in progress.`,
        },
      );
    }
    setPendingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
            Active Jobs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every job assigned to you, in schedule order.
          </p>
        </div>

        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <TabsList>
            {FILTERS.map((item) => (
              <TabsTrigger key={item.value} value={item.value}>
                {item.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {advance.error && (
        <ErrorState message={advance.error} onRetry={() => advance.reset()} />
      )}

      {error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : jobs.length === 0 ? (
        <EmptyState
          title={filter === "active" ? "No active jobs" : "Nothing to show"}
          description={
            filter === "active"
              ? "Accept a request to start working on a job."
              : "Completed jobs will appear here once you finish them."
          }
          icon={<Wrench className="size-6" />}
        />
      ) : (
        <div className="space-y-3">
          {jobs.map((booking) => (
            <JobRow
              key={booking.Id}
              booking={booking}
              actions={<StatusAction booking={booking} onAdvance={handleAdvance} isPending={pendingId === booking.Id || advance.isPending} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Renders only the one button the current status allows. Anything else would be
 * a 400 from the API, so the component never offers it.
 */
function StatusAction({
  booking,
  onAdvance,
  isPending,
}: {
  booking: Booking;
  onAdvance: (booking: Booking) => void | Promise<void>;
  isPending: boolean;
}) {
  if (booking.Status === BookingStatus.Scheduled) {
    return (
      <Button size="sm" disabled={isPending} onClick={() => void onAdvance(booking)}>
        <PlayCircle />
        {isPending ? "Starting…" : "Start job"}
      </Button>
    );
  }

  if (booking.Status === BookingStatus.InProgress) {
    return (
      <Button size="sm" variant="secondary" disabled={isPending} onClick={() => void onAdvance(booking)}>
        <CheckCircle2 />
        {isPending ? "Saving…" : "Mark complete"}
      </Button>
    );
  }

  return null;
}