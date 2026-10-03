import { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CalendarClock, MapPin, Star, User } from "lucide-react";
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
import { formatCurrency, formatDateTime, formatSchedule } from "@/lib/format";
import { cancelBooking, getBooking } from "@/services/bookings.service";
import { listTechnicianReviews } from "@/services/notifications.service";
import type { Booking } from "@/types/api";
import { BookingStatus } from "@/types/enums";
import { RatingDisplay } from "@/components/rating-input";
import {
  CancelBookingDialog,
  ReviewBookingDialog,
} from "./booking-card";

/**
 * Booking detail.
 *
 * Includes a progress timeline so the customer can see where their request sits:
 * Pending -> Scheduled -> In Progress -> Completed. Cancelled short-circuits the
 * timeline because the API allows no transition out of it.
 */
export function CustomerBookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const loader = useCallback(() => {
    if (!id) throw new Error("Missing booking id.");
    return getBooking(id);
  }, [id]);

  const { data, isLoading, error, refetch, setData } = useApiData<Booking>(loader, [id]);

  const cancel = useMutation(async () => {
    if (!id) return null;
    const updated = await cancelBooking(id);
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

  const canCancel =
    data.Status === BookingStatus.Pending || data.Status === BookingStatus.Scheduled;
  const canReview =
    data.Status === BookingStatus.Completed && Boolean(data.TechnicianId);

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
            Requested {formatDateTime(data.CreatedAt)}
          </p>
        </div>

        <p className="font-display text-2xl font-extrabold text-foreground">
          {formatCurrency(data.Amount)}
        </p>
      </div>

      <StatusTimeline status={data.Status} />

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Booking details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow icon={<CalendarClock className="size-4" />} label="Scheduled for">
              {formatSchedule(data.ScheduledDate, data.ScheduledTime)}
            </DetailRow>
            <DetailRow icon={<MapPin className="size-4" />} label="Service address">
              {data.Address}
            </DetailRow>
            <DetailRow icon={<User className="size-4" />} label="Technician">
              {data.TechnicianName ?? "Not assigned yet"}
            </DetailRow>
            {data.CompletedAt && (
              <DetailRow icon={<Star className="size-4" />} label="Completed">
                {formatDateTime(data.CompletedAt)}
              </DetailRow>
            )}
            {data.Notes && (
              <div className="rounded-lg bg-slate-50 p-3 text-slate-700">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Your notes
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
            {cancel.error && <ErrorState message={cancel.error} onRetry={() => cancel.reset()} />}

            <div className="flex flex-wrap gap-2">
              {canCancel && (
                <CancelBookingDialog
                  booking={data}
                  onCancel={async () => {
                    const updated = await cancel.mutate();
                    if (updated) setData(updated);
                    return updated !== null;
                  }}
                />
              )}

              {canReview && <ReviewBookingDialog booking={data} />}

              {!canCancel && !canReview && (
                <p className="rounded-lg bg-slate-50 p-3 text-muted-foreground">
                  {data.Status === BookingStatus.Completed
                    ? "This job is complete. Rating is available only if a technician was assigned."
                    : data.Status === BookingStatus.Cancelled
                      ? "This booking was cancelled."
                      : "No actions are available for an in-progress job."}
                </p>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              Cancelling is final — a cancelled booking cannot be reinstated. Once the job
              has started it can no longer be cancelled; contact the technician directly.
            </p>
          </CardContent>
        </Card>
      </div>

      {data.Status === BookingStatus.Completed && data.TechnicianId && (
        <TechnicianReviews technicianUserId={data.TechnicianId} />
      )}
    </div>
  );
}

/**
 * Reviews for the technician who did this job.
 *
 * The route takes a USER id (Review.TechnicianId joins on User.Id), which is what
 * Booking.TechnicianId holds — not TechnicianProfile.Id.
 */
function TechnicianReviews({ technicianUserId }: { technicianUserId: string }) {
  const loader = useCallback(() => listTechnicianReviews(technicianUserId), [
    technicianUserId,
  ]);
  const { data, isLoading } = useApiData(loader, [technicianUserId]);

  if (isLoading || !data || data.length === 0) return null;

  const average = data.reduce((sum, review) => sum + review.Rating, 0) / data.length;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-base">What others said</CardTitle>
          <p className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
            <RatingDisplay rating={average} />
            {average.toFixed(1)} from {data.length} review
            {data.length === 1 ? "" : "s"}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {data.slice(0, 3).map((review) => (
          <div key={review.Id} className="space-y-1 border-t border-slate-100 pt-4 first:border-0 first:pt-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-foreground">{review.CustomerName}</p>
              <RatingDisplay rating={review.Rating} />
            </div>
            {review.Comment && (
              <p className="text-sm text-muted-foreground">{review.Comment}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {formatDateTime(review.CreatedAt)}
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

const TIMELINE: Array<{ status: BookingStatus; label: string }> = [
  { status: BookingStatus.Pending, label: "Requested" },
  { status: BookingStatus.Scheduled, label: "Scheduled" },
  { status: BookingStatus.InProgress, label: "In progress" },
  { status: BookingStatus.Completed, label: "Completed" },
];

function StatusTimeline({ status }: { status: BookingStatus }) {
  if (status === BookingStatus.Cancelled) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4 text-sm text-red-800">
          This booking was cancelled.
        </CardContent>
      </Card>
    );
  }

  const currentIndex = TIMELINE.findIndex((step) => step.status === status);

  return (
    <Card>
      <CardContent className="p-5">
        <ol className="flex items-center gap-2">
          {TIMELINE.map((step, index) => {
            const isDone = index <= currentIndex;
            const isCurrent = index === currentIndex;

            return (
              <li key={step.status} className="flex flex-1 items-center gap-2">
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className={[
                      "flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors",
                      isDone
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-400",
                      isCurrent ? "ring-2 ring-blue-100" : "",
                    ].join(" ")}
                  >
                    {index + 1}
                  </span>
                  <span
                    className={[
                      "whitespace-nowrap text-xs font-medium",
                      isDone ? "text-foreground" : "text-muted-foreground",
                    ].join(" ")}
                  >
                    {step.label}
                  </span>
                </div>
                {index < TIMELINE.length - 1 && (
                  <span
                    className={[
                      "mb-5 h-0.5 flex-1 rounded-full",
                      index < currentIndex ? "bg-blue-600" : "bg-slate-200",
                    ].join(" ")}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
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