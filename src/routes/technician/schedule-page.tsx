import { useCallback, useMemo } from "react";
import { CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card, CardContent } from "@/components/ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { BookingStatusBadge } from "@/components/status-badge";
import { useApiData } from "@/hooks/useApiData";
import { getMyJobs } from "@/services/bookings.service";
import type { Booking } from "@/types/api";
import { BookingStatus } from "@/types/enums";
import { formatAmount, formatDate } from "@/lib/format";

/**
 * My Schedule.
 *
 * Groups the technician's Scheduled and InProgress jobs by day, upcoming first.
 * There is no calendar-range endpoint, so this pages over the technician's whole
 * job list and buckets it client-side.
 */
export function TechnicianSchedulePage() {
  const loader = useCallback(() => getMyJobs(), []);
  const { data, isLoading, error, refetch } = useApiData<Booking[]>(loader, []);

  const days = useMemo(() => groupByDay(data ?? []), [data]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          My Schedule
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Upcoming and in-progress jobs, grouped by day.
        </p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <LoadingState rows={5} />
      ) : days.length === 0 ? (
        <EmptyState
          title="Nothing scheduled"
          description="Accepted jobs are grouped here by the day they are booked for."
          icon={<CalendarDays className="size-6" />}
        />
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <section key={day.key} className="space-y-3">
              <div className="flex items-baseline gap-2">
                <h2 className="font-display text-lg font-bold text-foreground">
                  {day.label}
                </h2>
                <span className="text-sm text-muted-foreground">
                  {day.jobs.length} {day.jobs.length === 1 ? "job" : "jobs"} ·{" "}
                  {formatAmount(day.jobs.reduce((sum, job) => sum + job.Amount, 0))} NPR
                </span>
              </div>

              <div className="space-y-2">
                {day.jobs.map((booking) => (
                  <Card key={booking.Id}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <p className="w-20 shrink-0 font-display text-sm font-bold text-foreground">
                          {booking.ScheduledTime}
                        </p>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-semibold text-foreground">
                              {booking.ServiceName}
                            </p>
                            <BookingStatusBadge status={booking.Status} />
                          </div>
                          <p className="truncate text-xs text-muted-foreground">
                            {booking.CustomerName} · {booking.Address}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/technician/jobs/${booking.Id}`}>Details</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

interface ScheduleDay {
  key: string;
  label: string;
  jobs: Booking[];
}

function groupByDay(bookings: Booking[]): ScheduleDay[] {
  const active = bookings.filter(
    (booking) =>
      booking.Status === BookingStatus.Scheduled ||
      booking.Status === BookingStatus.InProgress,
  );

  const buckets = new Map<string, Booking[]>();

  for (const booking of active) {
    const key = booking.ScheduledDate.slice(0, 10);
    const list = buckets.get(key);
    if (list) list.push(booking);
    else buckets.set(key, [booking]);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, jobs]) => ({
      key,
      label: formatDate(key),
      jobs: jobs.sort((a, b) => a.ScheduledTime.localeCompare(b.ScheduledTime)),
    }));
}