import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, CheckCircle2, MapPin, PlayCircle, User } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";
import { BookingStatusBadge } from "@/components/status-badge";
import { ErrorState } from "@/components/feedback";
import { useApiData, useMutation } from "@/hooks/useApiData";
import { getBooking, updateJobStatus } from "@/services/bookings.service";
import { formatCurrency, formatDateTime, formatSchedule } from "@/lib/format";
import type { Booking } from "@/types/api";
import { BookingStatus } from "@/types/enums";

/**
 * Job detail.
 *
 * GET /Booking/{id} is ownership-checked server-side, so this screen only works
 * for the assigned technician (or admin) — an unassigned job request has to be
 * accepted from the requests list first.
 */
export function TechnicianJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const loader = useCallback(() => {
    if (!id) throw new Error("Missing booking id.");
    return getBooking(id);
  }, [id]);

  const { data, isLoading, error, refetch, setData } = useApiData<Booking>(loader, [id]);

  const advance = useMutation(async (next: BookingStatus) => {
    if (!id) return null;
    const updated = await updateJobStatus(id, next);
    setData(updated);
    return updated;
  });

  if (error) {
    return (
      <div className="space-y-4">
        <BackButton onClick={() => navigate(-1)} />
        <ErrorState message={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-4">
        <BackButton onClick={() => navigate(-1)} />
        <Card>
          <CardContent className="space-y-3 p-5">
            <Skeleton className="h-6 w-52" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const nextStatus =
    data.Status === BookingStatus.Scheduled
      ? BookingStatus.InProgress
      : data.Status === BookingStatus.InProgress
        ? BookingStatus.Completed
        : null;

  return (
    <div className="space-y-6">
      <BackButton onClick={() => navigate(-1)} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
              {data.ServiceName}
            </h1>
            <BookingStatusBadge status={data.Status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Booked {formatDateTime(data.CreatedAt)}
          </p>
        </div>

        <p className="font-display text-2xl font-extrabold text-foreground">
          {formatCurrency(data.Amount)}
        </p>
      </div>

      {advance.error && <ErrorState message={advance.error} onRetry={() => advance.reset()} />}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Job details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow icon={<CalendarClock className="size-4" />} label="Scheduled">
              {formatSchedule(data.ScheduledDate, data.ScheduledTime)}
            </DetailRow>
            <DetailRow icon={<MapPin className="size-4" />} label="Address">
              {data.Address}
            </DetailRow>
            <DetailRow icon={<User className="size-4" />} label="Customer">
              {data.CustomerName}
            </DetailRow>
            {data.CompletedAt && (
              <DetailRow icon={<CheckCircle2 className="size-4" />} label="Completed">
                {formatDateTime(data.CompletedAt)}
              </DetailRow>
            )}
            {data.Notes && (
              <div className="rounded-lg bg-slate-50 p-3 text-slate-700">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Customer notes
                </p>
                {data.Notes}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow icon={<User className="size-4" />} label="Assigned technician">
              {data.TechnicianName ?? "Unassigned"}
            </DetailRow>

            {nextStatus ? (
              <Button
                className="w-full"
                disabled={advance.isPending}
                onClick={async () => {
                  const updated = await advance.mutate(nextStatus);
                  if (updated) {
                    toast.success(
                      nextStatus === BookingStatus.InProgress
                        ? "Job started"
                        : "Job completed",
                    );
                  }
                }}
              >
                {nextStatus === BookingStatus.InProgress ? (
                  <>
                    <PlayCircle />
                    {advance.isPending ? "Starting…" : "Start job"}
                  </>
                ) : (
                  <>
                    <CheckCircle2 />
                    {advance.isPending ? "Saving…" : "Mark complete"}
                  </>
                )}
              </Button>
            ) : (
              <p className="rounded-lg bg-slate-50 p-3 text-muted-foreground">
                {data.Status === BookingStatus.Pending
                  ? "Accept this job from Service Requests before you can start it."
                  : data.Status === BookingStatus.Cancelled
                    ? "This job was cancelled."
                    : "This job is finished — no further action is available."}
              </p>
            )}

            <p className="text-xs text-muted-foreground">
              Jobs can only move forward: Scheduled → In Progress → Completed. Any other
              change is rejected by the API.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick}>
      <ArrowLeft />
      Back
    </Button>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
        <div className="text-slate-700">{children}</div>
      </div>
    </div>
  );
}