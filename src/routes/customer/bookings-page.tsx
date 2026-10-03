import { useCallback, useMemo, useState } from "react";
import { CalendarPlus, ClipboardList } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Button, Tabs, TabsList, TabsTrigger } from "@/components/ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { useApiData, useMutation } from "@/hooks/useApiData";
import { cancelBooking, getMyBookings } from "@/services/bookings.service";
import type { Booking } from "@/types/api";
import { BookingStatus } from "@/types/enums";
import { CustomerBookingCard } from "./booking-card";

type Filter = "active" | "completed" | "cancelled" | "all";

const FILTERS: Array<{ value: Filter; label: string }> = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "all", label: "All" },
];

const ACTIVE_STATUSES: BookingStatus[] = [
  BookingStatus.Pending,
  BookingStatus.Scheduled,
  BookingStatus.InProgress,
];

/** My Bookings — every booking the signed-in customer owns. */
export function CustomerBookingsPage() {
  const [filter, setFilter] = useState<Filter>("active");

  const loader = useCallback(() => getMyBookings(), []);
  const { data, isLoading, error, refetch, setData } = useApiData<Booking[]>(loader, []);

  const cancel = useMutation(async (booking: Booking) => {
    const updated = await cancelBooking(booking.Id);
    setData((current) =>
      current?.map((item) => (item.Id === updated.Id ? updated : item)) ?? current,
    );
    toast.success("Booking cancelled", {
      description: `${updated.ServiceName} has been cancelled.`,
    });
    return updated;
  });

  const bookings = useMemo(() => filterBookings(data, filter), [data, filter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
            My Bookings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Track requests, scheduled visits and past jobs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
            <TabsList>
              {FILTERS.map((item) => (
                <TabsTrigger key={item.value} value={item.value}>
                  {item.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Button size="sm" asChild>
            <Link to="/customer/book">
              <CalendarPlus />
              New booking
            </Link>
          </Button>
        </div>
      </div>

      {cancel.error && (
        <ErrorState message={cancel.error} onRetry={() => cancel.reset()} />
      )}

      {error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : bookings.length === 0 ? (
        <EmptyState
          title={emptyTitleFor(filter)}
          description={emptyDescriptionFor(filter)}
          icon={<ClipboardList className="size-6" />}
          action={
            filter === "active" ? (
              <Button size="sm" asChild>
                <Link to="/customer/book">Book a service</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <CustomerBookingCard
              key={booking.Id}
              booking={booking}
              onCancel={async (target) => (await cancel.mutate(target)) !== null}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function filterBookings(bookings: Booking[] | null, filter: Filter): Booking[] {
  if (!bookings) return [];

  // Newest first so a freshly created booking appears at the top.
  const sorted = [...bookings].sort((a, b) => b.CreatedAt.localeCompare(a.CreatedAt));

  switch (filter) {
    case "active":
      return sorted.filter((booking) => ACTIVE_STATUSES.includes(booking.Status));
    case "completed":
      return sorted.filter((booking) => booking.Status === BookingStatus.Completed);
    case "cancelled":
      return sorted.filter((booking) => booking.Status === BookingStatus.Cancelled);
    default:
      return sorted;
  }
}

function emptyTitleFor(filter: Filter): string {
  switch (filter) {
    case "active":
      return "No active bookings";
    case "completed":
      return "No completed jobs yet";
    case "cancelled":
      return "Nothing cancelled";
    default:
      return "No bookings yet";
  }
}

function emptyDescriptionFor(filter: Filter): string {
  switch (filter) {
    case "active":
      return "Request a service and it will show up here while it is being handled.";
    case "completed":
      return "Finished jobs appear here, and you can rate the technician.";
    case "cancelled":
      return "You have not cancelled any bookings.";
    default:
      return "Book your first service to get started.";
  }
}