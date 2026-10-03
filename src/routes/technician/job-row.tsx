import { CalendarClock, MapPin, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, CardContent } from "@/components/ui";
import { BookingStatusBadge } from "@/components/status-badge";
import { formatCurrency, formatSchedule } from "@/lib/format";
import type { Booking } from "@/types/api";
import { BookingStatus } from "@/types/enums";

/**
 * A single job row.
 *
 * Mirrors the prototype's request rows: service name, NPR amount, the
 * "date at time" line and an icon-prefixed location line, with the action
 * buttons on the right.
 */
export function JobRow({
  booking,
  actions,
}: {
  booking: Booking;
  actions?: React.ReactNode;
}) {
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
              {/* Long addresses are truncated on one line — the full value stays
                  in the title attribute for hover. */}
              <span className="truncate" title={booking.Address}>
                {booking.Address}
              </span>
            </span>
          </div>

          <p className="text-xs text-muted-foreground">
            Customer: <span className="font-medium text-slate-700">{booking.CustomerName}</span>
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
          <div className="flex items-center gap-2">
            {actions ?? (
              <Button variant="outline" size="sm" asChild>
                <Link to={`/technician/jobs/${booking.Id}`}>
                  <Wrench />
                  Details
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/** Compact variant for dashboard side-panels, which only show three rows. */
export function JobRowCompact({ booking }: { booking: Booking }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3.5">
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {booking.ServiceName}
          </p>
          <BookingStatusBadge status={booking.Status} />
        </div>
        <p className="text-xs text-muted-foreground">
          {formatSchedule(booking.ScheduledDate, booking.ScheduledTime)} ·{" "}
          {booking.Address}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-bold text-foreground">{formatCurrency(booking.Amount)}</p>
        {booking.Status === BookingStatus.Scheduled && (
          <Badge variant="outline" className="mt-1">
            Today
          </Badge>
        )}
      </div>
    </div>
  );
}