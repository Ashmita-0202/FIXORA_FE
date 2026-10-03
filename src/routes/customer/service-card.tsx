import { Clock, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge, Button, Card, CardContent, Skeleton } from "@/components/ui";
import { formatCurrency } from "@/lib/format";
import type { ServiceCategory } from "@/types/api";

/**
 * Service card.
 *
 * `BaseServiceCharge` is shown as the service's base charge, not as a quote:
 * Booking.Amount is computed by the API when the booking is created and cannot be
 * set by the client, so presenting this as the final price would be wrong.
 *
 * IconUrl is free text from the admin — anything that is not an http(s) URL is
 * ignored in favour of the fallback icon, which stops a bad value from rendering
 * as a broken image.
 */
export function ServiceCard({ service }: { service: ServiceCategory }) {
  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-11 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            {isRenderableUrl(service.IconUrl) ? (
              <img
                src={service.IconUrl as string}
                alt=""
                className="size-6 object-contain"
                loading="lazy"
              />
            ) : (
              <Wrench className="size-5" />
            )}
          </div>
          {!service.IsActive && <Badge variant="outline">Unavailable</Badge>}
        </div>

        <div className="space-y-1.5">
          <h3 className="font-semibold text-foreground">{service.CategoryName}</h3>
          {service.Description && (
            <p className="line-clamp-2 text-sm text-muted-foreground">
              {service.Description}
            </p>
          )}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-2">
          <div>
            <p className="text-xs text-muted-foreground">Base charge</p>
            <p className="font-display text-lg font-bold text-foreground">
              {formatCurrency(service.BaseServiceCharge)}
            </p>
            {service.EstimatedDuration && (
              <p className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3" />
                {service.EstimatedDuration}
              </p>
            )}
          </div>

          <Button size="sm" asChild disabled={!service.IsActive}>
            <Link to={`/customer/book?service=${service.Id}`}>Book now</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function ServiceCardSkeleton() {
  return <Skeleton className="h-52 w-full" />;
}

function isRenderableUrl(value: string | null | undefined): value is string {
  if (!value) return false;
  return /^https?:\/\//i.test(value);
}