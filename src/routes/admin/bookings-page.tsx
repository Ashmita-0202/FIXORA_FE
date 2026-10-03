import { useCallback, useState } from "react";
import { ClipboardList } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { BookingStatusBadge, bookingStatusLabel } from "@/components/status-badge";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { useApiData, useMutation } from "@/hooks/useApiData";
import { formatCurrency, formatDate, formatDateTime, formatSchedule } from "@/lib/format";
import { getAllBookings, updateJobStatus } from "@/services/bookings.service";
import type { Booking } from "@/types/api";
import { BOOKING_STATUS_TRANSITIONS, BookingStatus } from "@/types/enums";

type StatusFilter = BookingStatus | "all";

/**
 * All bookings across the platform.
 *
 * GET /Booking/all is intentionally unfiltered by technician — it is the admin
 * view. Status changes go through the same endpoint the technician uses, because
 * the server allows the technician of record *or* an admin, so an admin is not
 * confined to a customer's cancellation rules or a technician's transitions.
 */
export function AdminBookingsPage() {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Booking | null>(null);

  const loader = useCallback(() => getAllBookings(), []);
  const { data, isLoading, error, refetch, setData } = useApiData<Booking[]>(loader, []);

  const advance = useMutation(
    async ({ booking, status: next }: { booking: Booking; status: BookingStatus }) => {
      const updated = await updateJobStatus(booking.Id, next);
      setData((current) =>
        current?.map((item) => (item.Id === updated.Id ? updated : item)) ?? current,
      );
      setSelected((current) => (current?.Id === updated.Id ? updated : current));
      toast.success("Booking updated", {
        description: `${updated.ServiceName} is now ${bookingStatusLabel(updated.Status).toLowerCase()}.`,
      });
      return updated;
    },
  );

  const bookings = (data ?? []).filter((booking) =>
    status === "all" ? true : booking.Status === status,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
            Bookings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Every booking on the platform. Open one to review it or move it through the
            workflow.
          </p>
        </div>

        <Select
          value={status}
          onValueChange={(value) => setStatus(value as StatusFilter)}
        >
          <SelectTrigger className="w-[190px]" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {Object.values(BookingStatus).map((value) => (
              <SelectItem key={value} value={value}>
                {bookingStatusLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {advance.error && (
        <ErrorState message={advance.error} onRetry={() => advance.reset()} />
      )}

      {error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : bookings.length === 0 ? (
        <EmptyState
          title="No bookings"
          description={
            status === "all"
              ? "Customer bookings will appear here as they are made."
              : `No bookings are currently ${bookingStatusLabel(status).toLowerCase()}.`
          }
          icon={<ClipboardList className="size-6" />}
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-card">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Technician</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings.map((booking) => (
                  <TableRow key={booking.Id}>
                    <TableCell className="font-medium text-foreground">
                      {booking.ServiceName}
                    </TableCell>
                    <TableCell className="text-slate-600">{booking.CustomerName}</TableCell>
                    <TableCell className="text-slate-600">
                      {booking.TechnicianName ?? "Unassigned"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-600">
                      {formatSchedule(booking.ScheduledDate, booking.ScheduledTime)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap font-medium text-foreground">
                      {formatCurrency(booking.Amount)}
                    </TableCell>
                    <TableCell>
                      <BookingStatusBadge status={booking.Status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => setSelected(booking)}>
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs text-muted-foreground">
            {bookings.length} of {data?.length ?? 0} bookings
          </p>
        </>
      )}

      <BookingReviewDialog
        booking={selected}
        isPending={advance.isPending}
        error={advance.error}
        onOpenChange={(open) => !open && setSelected(null)}
        onTransition={(next) => {
          if (selected) void advance.mutate({ booking: selected, status: next });
        }}
      />
    </div>
  );
}

function BookingReviewDialog({
  booking,
  isPending,
  error,
  onOpenChange,
  onTransition,
}: {
  booking: Booking | null;
  isPending: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onTransition: (status: BookingStatus) => void;
}) {
  /**
   * Transitions come from the shared client-side map, which mirrors the
   * server's rules. The server is still the authority — it enforces ownership
   * (technician of record or admin) — but offering a button that is guaranteed
   * to fail would just be noise.
   */
  const transitions = booking ? BOOKING_STATUS_TRANSITIONS[booking.Status] : [];

  return (
    <Dialog open={booking !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{booking?.ServiceName ?? "Booking"}</DialogTitle>
          <DialogDescription>
            Booked {formatDateTime(booking?.CreatedAt)}
            {booking?.CompletedAt && ` · completed ${formatDate(booking.CompletedAt)}`}
          </DialogDescription>
        </DialogHeader>

        {booking && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <Detail label="Customer" value={booking.CustomerName} />
              <Detail label="Technician" value={booking.TechnicianName ?? "Unassigned"} />
              <Detail label="Scheduled" value={formatSchedule(booking.ScheduledDate, booking.ScheduledTime)} />
              <Detail label="Amount" value={formatCurrency(booking.Amount)} />
              <Detail label="Address" value={booking.Address} />
              <Detail label="Status" value={bookingStatusLabel(booking.Status)} />
            </div>

            {booking.Notes && (
              <div className="rounded-md bg-slate-50 p-3 text-sm">
                <p className="font-medium text-slate-700">Customer notes</p>
                <p className="mt-1 text-slate-600">{booking.Notes}</p>
              </div>
            )}

            {error && <p className="text-sm font-medium text-red-600">{error}</p>}

            {transitions.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {booking.TechnicianName
                  ? "This booking has reached a final status."
                  : "Assign a technician to move this booking forward."}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          {transitions.map((next) => (
            <Button key={next} disabled={isPending} onClick={() => onTransition(next)}>
              Mark {bookingStatusLabel(next).toLowerCase()}
            </Button>
          ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate font-medium text-foreground">{value}</p>
    </div>
  );
}