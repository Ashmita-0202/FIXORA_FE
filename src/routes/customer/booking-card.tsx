import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, MapPin, Star } from "lucide-react";
import {
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
import { RatingInput } from "@/components/rating-input";
import { BookingStatusBadge } from "@/components/status-badge";
import { useMutation } from "@/hooks/useApiData";
import { formatCurrency, formatSchedule } from "@/lib/format";
import { createReview } from "@/services/notifications.service";
import type { Booking } from "@/types/api";
import { BookingStatus } from "@/types/enums";

const COMMENT_MAX_LENGTH = 1000;

/**
 * Customer-facing booking card.
 *
 * Which actions appear is derived from the booking's status rather than from a
 * role check, because the API enforces the same rules: cancel is rejected once a
 * job is InProgress or beyond, and a review is only accepted for a Completed job
 * that actually has a technician assigned.
 */
export function CustomerBookingCard({
  booking,
  onCancel,
}: {
  booking: Booking;
  /** Resolves false when the API rejected the cancellation. */
  onCancel?: (booking: Booking) => Promise<boolean>;
}) {
  const canCancel =
    booking.Status === BookingStatus.Pending ||
    booking.Status === BookingStatus.Scheduled;

  const canReview =
    booking.Status === BookingStatus.Completed && Boolean(booking.TechnicianId);

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-foreground">{booking.ServiceName}</h3>
            <BookingStatusBadge status={booking.Status} />
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <CalendarClock className="size-3.5 shrink-0" />
              {formatSchedule(booking.ScheduledDate, booking.ScheduledTime)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate" title={booking.Address}>
                {booking.Address}
              </span>
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Technician:{" "}
            <span className="font-medium text-slate-700">
              {booking.TechnicianName ?? "Not assigned yet"}
            </span>
          </p>

          {booking.Notes && (
            <p className="line-clamp-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
              {booking.Notes}
            </p>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
          <p className="font-display text-lg font-bold text-foreground">
            {formatCurrency(booking.Amount)}
          </p>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/customer/bookings/${booking.Id}`}>Details</Link>
            </Button>

            {canCancel && onCancel && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:bg-red-50">
                    Cancel
                  </Button>
                </DialogTrigger>
                <CancelBookingDialog booking={booking} onCancel={onCancel} />
              </Dialog>
            )}

            {canReview && <ReviewBookingDialog booking={booking} />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Cancellation is confirmed in a dialog because the API offers no undo: a
 * cancelled booking cannot be reinstated, it has to be booked again.
 */
export function CancelBookingDialog({
  booking,
  onCancel,
}: {
  booking: Booking;
  onCancel: (booking: Booking) => Promise<boolean>;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const cancel = useMutation(async () => onCancel(booking));

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel this booking?</DialogTitle>
          <DialogDescription>
            {booking.ServiceName} on{" "}
            {formatSchedule(booking.ScheduledDate, booking.ScheduledTime)}. This cannot
            be undone — you would need to book again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={cancel.isPending}
          >
            Keep booking
          </Button>
          <Button
            variant="danger"
            disabled={cancel.isPending}
            onClick={async () => {
              // Stay open on failure so the page-level error is visible and the
              // customer can retry without re-confirming.
              const succeeded = await cancel.mutate();
              if (succeeded) setIsOpen(false);
            }}
          >
            {cancel.isPending ? "Cancelling…" : "Cancel booking"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Rating 1–5 plus an optional comment, per the API's review rules. */
export function ReviewBookingDialog({ booking }: { booking: Booking }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const submit = useMutation(async () => {
    await createReview({
      BookingId: booking.Id,
      Rating: rating,
      Comment: comment.trim() || null,
    });
  });

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset only when closing, so a failed submit keeps what was typed.
      setRating(0);
      setComment("");
      submit.reset();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Star />
          Rate service
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate {booking.ServiceName}</DialogTitle>
          <DialogDescription>
            Your feedback helps other customers choose. Technician:{" "}
            {booking.TechnicianName}.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {submit.error && (
            <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {submit.error}
            </p>
          )}

          <RatingInput value={rating} onChange={setRating} />

          <div className="space-y-1.5">
            <label
              htmlFor="review-comment"
              className="text-sm font-medium text-slate-700"
            >
              Comment (optional)
            </label>
            <Textarea
              id="review-comment"
              rows={4}
              maxLength={COMMENT_MAX_LENGTH}
              placeholder="How did it go?"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              {comment.length}/{COMMENT_MAX_LENGTH}
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Not now
          </Button>
          <Button
            disabled={rating === 0 || submit.isPending}
            onClick={async () => {
              const created = await submit.mutate();
              if (created) {
                setIsOpen(false);
              }
            }}
          >
            {submit.isPending ? "Submitting…" : "Submit review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}