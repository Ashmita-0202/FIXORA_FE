import { useCallback } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, ClipboardList, Wrench } from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { BookingStatusBadge } from "@/components/status-badge";
import { useAuth } from "@/context/AuthContext";
import { useApiData } from "@/hooks/useApiData";
import { firstNameOf, formatDate, formatSchedule, greetingFor } from "@/lib/format";
import { getMyBookings } from "@/services/bookings.service";
import { listServices } from "@/services/categories.service";
import { BookingStatus } from "@/types/enums";
import { ServiceCard, ServiceCardSkeleton } from "./service-card";

/**
 * Customer home.
 *
 * Two independent loads: the active service catalogue and the customer's own
 * bookings. They are fetched together and each is handled separately, so an
 * empty catalogue (the backend ships no seed data) does not hide the customer's
 * existing bookings and vice versa.
 */
export function CustomerHomePage() {
  const { user } = useAuth();
  const firstName = firstNameOf(user ? `${user.FirstName} ${user.LastName}` : null);

  const servicesLoader = useCallback(() => listServices(true), []);
  const bookingsLoader = useCallback(() => getMyBookings(), []);

  const services = useApiData(servicesLoader, []);
  const bookings = useApiData(bookingsLoader, []);

  const upcoming = (bookings.data ?? [])
    .filter(
      (booking) =>
        booking.Status === BookingStatus.Pending ||
        booking.Status === BookingStatus.Scheduled ||
        booking.Status === BookingStatus.InProgress,
    )
    .sort((a, b) => a.ScheduledDate.localeCompare(b.ScheduledDate));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          {greetingFor()}, {firstName}!
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Book a trusted technician for your home or office repairs.
        </p>
      </div>

      {/* Upcoming bookings */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base">Upcoming bookings</CardTitle>
            <CardDescription>Jobs that are pending, scheduled or in progress</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/customer/bookings">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {bookings.error ? (
            <ErrorState message={bookings.error} onRetry={() => void bookings.refetch()} />
          ) : bookings.isLoading ? (
            <LoadingState rows={2} />
          ) : upcoming.length === 0 ? (
            <EmptyState
              title="No upcoming bookings"
              description="Choose a service below to get started."
              icon={<CalendarPlus className="size-6" />}
              action={
                <Button size="sm" asChild>
                  <Link to="/customer/book">Book a service</Link>
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {upcoming.slice(0, 3).map((booking) => (
                <Link
                  key={booking.Id}
                  to={`/customer/bookings/${booking.Id}`}
                  className="flex items-center justify-between gap-4 py-3.5 transition-colors hover:bg-slate-50/60"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {booking.ServiceName}
                      </p>
                      <BookingStatusBadge status={booking.Status} />
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatSchedule(booking.ScheduledDate, booking.ScheduledTime)}
                      {booking.TechnicianName ? ` · ${booking.TechnicianName}` : ""}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-foreground">
                    {formatDate(booking.ScheduledDate)}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service catalogue */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Our services</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Fixed base charges set by the service provider
            </p>
          </div>
        </div>

        {services.error ? (
          <ErrorState message={services.error} onRetry={() => void services.refetch()} />
        ) : services.isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <ServiceCardSkeleton />
            <ServiceCardSkeleton />
            <ServiceCardSkeleton />
          </div>
        ) : (services.data ?? []).length === 0 ? (
          <Card>
            <CardContent className="py-0">
              <EmptyState
                title="No services available yet"
                description="Services have not been published yet. Please check back shortly."
                icon={<Wrench className="size-6" />}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {services.data?.map((service) => (
              <ServiceCard key={service.Id} service={service} />
            ))}
          </div>
        )}
      </section>

      {/* Past activity */}
      {bookings.data && bookings.data.length > upcoming.length && (
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base">Recent activity</CardTitle>
              <CardDescription>Your latest completed and cancelled bookings</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-slate-100">
              {bookings.data
                .filter(
                  (booking) =>
                    booking.Status === BookingStatus.Completed ||
                    booking.Status === BookingStatus.Cancelled,
                )
                .slice(0, 3)
                .map((booking) => (
                  <Link
                    key={booking.Id}
                    to={`/customer/bookings/${booking.Id}`}
                    className="flex items-center justify-between gap-4 py-3.5 transition-colors hover:bg-slate-50/60"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {booking.ServiceName}
                        </p>
                        <BookingStatusBadge status={booking.Status} />
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {booking.TechnicianName ?? "No technician assigned"}
                      </p>
                    </div>
                    <ClipboardList className="size-4 shrink-0 text-slate-400" />
                  </Link>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}