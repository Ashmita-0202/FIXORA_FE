import { useCallback, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarPlus, Info } from "lucide-react";
import { toast } from "sonner";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Textarea,
} from "@/components/ui";
import { ErrorState } from "@/components/feedback";
import { useApiData, useMutation } from "@/hooks/useApiData";
import { TIME_SLOTS, formatCurrency, todayDateInputValue } from "@/lib/format";
import { createBooking } from "@/services/bookings.service";
import { listServices } from "@/services/categories.service";
import { getMyProfile } from "@/services/user.service";
import type { MyProfile, ServiceCategory } from "@/types/api";

const NOTES_MAX_LENGTH = 500;

/**
 * Book a service.
 *
 * The selected service lives in the page rather than inside BookingForm so the
 * summary panel can react to it. Because the selection is a controlled prop and
 * not a remount, changing the service never discards the rest of the form.
 *
 * BookingForm is mounted with `key={profile.Id}` so its fields seed from props in
 * state initializers — the address prefills from the profile without an effect
 * writing to state after render.
 */
export function BookServicePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const servicesLoader = useCallback(() => listServices(true), []);
  const profileLoader = useCallback(() => getMyProfile(), []);

  const services = useApiData(servicesLoader, []);
  const profile = useApiData(profileLoader, []);

  const [serviceId, setServiceId] = useState(searchParams.get("service") ?? "");

  if (services.error) {
    return (
      <div className="space-y-4">
        <Heading />
        <ErrorState message={services.error} onRetry={() => void services.refetch()} />
      </div>
    );
  }

  const activeServices = services.data ?? [];
  const selectedService = activeServices.find((service) => service.Id === serviceId);

  return (
    <div className="space-y-6">
      <Heading />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle className="text-base">Booking details</CardTitle>
              <CardDescription>Tell us what you need and when</CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {services.isLoading || profile.isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : profile.error ? (
              <ErrorState message={profile.error} onRetry={() => void profile.refetch()} />
            ) : (
              <BookingForm
                key={profile.data?.Id ?? "profile"}
                profile={profile.data}
                services={activeServices}
                serviceId={serviceId}
                onServiceChange={setServiceId}
                onBooked={(bookingId) =>
                  navigate(`/customer/bookings/${bookingId}`, { replace: true })
                }
              />
            )}
          </CardContent>
        </Card>

        <SummaryPanel selectedService={selectedService} />
      </div>
    </div>
  );
}

/**
 * Booking form.
 *
 * There is deliberately no amount field: Booking.Amount is computed server-side
 * from the service's base charge at creation time and cannot be overridden, so a
 * client-side amount would be ignored at best and misleading at worst.
 */
function BookingForm({
  profile,
  services,
  serviceId,
  onServiceChange,
  onBooked,
}: {
  profile: MyProfile | null;
  services: ServiceCategory[];
  serviceId: string;
  onServiceChange: (id: string) => void;
  onBooked: (bookingId: string) => void;
}) {
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [address, setAddress] = useState(profile?.Address ?? "");
  const [notes, setNotes] = useState("");

  const selectedService = services.find((service) => service.Id === serviceId);

  const submit = useMutation(async () => {
    return createBooking({
      ServiceCategoryId: serviceId,
      ScheduledDate: scheduledDate,
      ScheduledTime: scheduledTime,
      Address: address.trim(),
      Notes: notes.trim() || null,
    });
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const booking = await submit.mutate();
    if (booking) {
      toast.success("Booking request sent", {
        description: "A technician will be assigned shortly.",
      });
      onBooked(booking.Id);
    }
  };

  if (services.length === 0) {
    return (
      <Alert variant="info">
        <Info />
        <AlertDescription>
          No services are available for booking yet. Please check back later.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {submit.error && <ErrorState message={submit.error} onRetry={() => submit.reset()} />}

      <div className="space-y-1.5">
        <Label htmlFor="service">Service</Label>
        <Select value={serviceId} onValueChange={onServiceChange}>
          <SelectTrigger id="service">
            <SelectValue placeholder="Choose a service" />
          </SelectTrigger>
          <SelectContent>
            {services.map((service) => (
              <SelectItem key={service.Id} value={service.Id}>
                {service.CategoryName} — {formatCurrency(service.BaseServiceCharge)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="date">Preferred date</Label>
          <Input
            id="date"
            type="date"
            required
            min={todayDateInputValue()}
            value={scheduledDate}
            onChange={(event) => setScheduledDate(event.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="time">Preferred time</Label>
          <Select value={scheduledTime} onValueChange={setScheduledTime}>
            <SelectTrigger id="time">
              <SelectValue placeholder="Choose a time slot" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((slot) => (
                <SelectItem key={slot} value={slot}>
                  {slot}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="address">Service address</Label>
        <Input
          id="address"
          required
          placeholder="Where should the technician come?"
          value={address}
          onChange={(event) => setAddress(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Defaults to the address on your profile. Change it here if the technician
          should come somewhere else.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea
          id="notes"
          rows={4}
          maxLength={NOTES_MAX_LENGTH}
          placeholder="Anything the technician should know — model number, symptoms, access instructions."
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          {notes.length}/{NOTES_MAX_LENGTH}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <p className="text-sm text-muted-foreground">
          {selectedService
            ? `Base charge ${formatCurrency(selectedService.BaseServiceCharge)}`
            : "Select a service to see its base charge"}
        </p>
        <Button type="submit" disabled={submit.isPending}>
          <CalendarPlus />
          {submit.isPending ? "Sending…" : "Request booking"}
        </Button>
      </div>
    </form>
  );
}

function SummaryPanel({ selectedService }: { selectedService?: ServiceCategory }) {
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-base">Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {selectedService ? (
          <>
            <Row label="Service" value={selectedService.CategoryName} />
            {selectedService.EstimatedDuration && (
              <Row label="Estimated duration" value={selectedService.EstimatedDuration} />
            )}
            <Row
              label="Base charge"
              value={formatCurrency(selectedService.BaseServiceCharge)}
            />
          </>
        ) : (
          <p className="text-muted-foreground">
            Choose a service to see its base charge and estimated duration.
          </p>
        )}

        <p className="border-t border-slate-100 pt-3 text-xs text-muted-foreground">
          Your booking starts as <strong>Pending</strong>. An available technician
          accepts it, which moves it to <strong>Scheduled</strong>. The final amount is
          calculated by the service provider when the job is accepted.
        </p>
      </CardContent>
    </Card>
  );
}

function Heading() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
        Book a service
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose a service and tell us when you need it.
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}