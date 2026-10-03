import { useCallback } from "react";
import { Link } from "react-router-dom";
import {
  CalendarCheck,
  ClipboardList,
  UserCheck,
  Users,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";
import { ErrorState, StatCardSkeleton } from "@/components/feedback";
import { useApiData } from "@/hooks/useApiData";
import { formatCurrency } from "@/lib/format";
import { getDashboardStats } from "@/services/admin.service";
import type { DashboardStats } from "@/types/api";
import { BookingStatus } from "@/types/enums";

/**
 * Admin dashboard.
 *
 * Everything here comes from a single GET /Admin/dashboard-stats call, so the
 * page issues one request. The booking mix is drawn with plain CSS bars rather
 * than Recharts: the technician portal already pulls that dependency for its
 * earnings curve, and an admin should not download ~110 kB gzipped of charting
 * library for five static bars.
 */
export function AdminDashboardPage() {
  const loader = useCallback(() => getDashboardStats(), []);
  const { data, isLoading, error, refetch } = useApiData<DashboardStats>(loader, []);

  if (error) {
    return (
      <div className="space-y-6">
        <Heading />
        <ErrorState message={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  const pendingApplications = data?.PendingTechnicianApplications ?? 0;

  return (
    <div className="space-y-6">
      <Heading />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading || !data ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatTile
              label="Total Customers"
              value={String(data.TotalCustomers)}
              icon={<Users className="size-5" />}
              iconClassName="bg-blue-100 text-blue-600"
              to="/admin/customers"
            />
            <StatTile
              label="Technicians"
              value={String(data.TotalTechnicians)}
              icon={<UserCheck className="size-5" />}
              iconClassName="bg-emerald-100 text-emerald-600"
              to="/admin/technicians"
            />
            <StatTile
              label="Pending Applications"
              value={String(pendingApplications)}
              icon={<ClipboardList className="size-5" />}
              iconClassName="bg-amber-100 text-amber-600"
              to="/admin/applications"
              emphasise={pendingApplications > 0}
            />
            <StatTile
              label="Total Bookings"
              value={String(data.TotalBookings)}
              icon={<CalendarCheck className="size-5" />}
              iconClassName="bg-purple-100 text-purple-600"
              to="/admin/bookings"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <div>
              <CardTitle className="text-base">Bookings by status</CardTitle>
              <CardDescription>Current distribution across the platform</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/admin/bookings">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <div className="space-y-3">
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            ) : (
              <StatusBreakdown stats={data} />
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div>
                <CardTitle className="text-base">Revenue</CardTitle>
                <CardDescription>Sum of all booking amounts</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading || !data ? (
                <Skeleton className="h-10 w-40" />
              ) : (
                <p className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                  {formatCurrency(data.TotalRevenue)}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle className="text-base">Completion rate</CardTitle>
                <CardDescription>Completed bookings as a share of all bookings</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading || !data ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <>
                  <p className="font-display text-3xl font-extrabold tracking-tight text-foreground">
                    {data.CompletionRatePercent.toFixed(1)}%
                  </p>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, data.CompletionRatePercent))}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {data.CompletedBookings} completed of {data.TotalBookings} total
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

const STATUS_ROWS: Array<{
  status: BookingStatus;
  label: string;
  barClass: string;
  pick: (stats: DashboardStats) => number;
}> = [
  {
    status: BookingStatus.Pending,
    label: "Pending",
    barClass: "bg-amber-500",
    pick: (stats) => stats.PendingBookings,
  },
  {
    status: BookingStatus.Scheduled,
    label: "Scheduled",
    barClass: "bg-purple-500",
    pick: (stats) => stats.ScheduledBookings,
  },
  {
    status: BookingStatus.InProgress,
    label: "In progress",
    barClass: "bg-blue-600",
    pick: (stats) => stats.InProgressBookings,
  },
  {
    status: BookingStatus.Completed,
    label: "Completed",
    barClass: "bg-emerald-500",
    pick: (stats) => stats.CompletedBookings,
  },
  {
    status: BookingStatus.Cancelled,
    label: "Cancelled",
    barClass: "bg-red-500",
    pick: (stats) => stats.CancelledBookings,
  },
];

/** Bars are scaled against the largest bucket so the shape reads clearly even
 *  when every count is small, with the raw numbers always shown alongside. */
function StatusBreakdown({ stats }: { stats: DashboardStats }) {
  const rows = STATUS_ROWS.map((row) => ({ ...row, count: row.pick(stats) }));
  const max = Math.max(1, ...rows.map((row) => row.count));

  if (stats.TotalBookings === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No bookings have been made yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.status} className="space-y-1.5">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="font-medium text-foreground">{row.label}</span>
            <span className="text-muted-foreground">{row.count}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${row.barClass} transition-all`}
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Heading() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
        Admin dashboard
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Platform activity at a glance.
      </p>
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  iconClassName,
  to,
  emphasise = false,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconClassName: string;
  to: string;
  emphasise?: boolean;
}) {
  return (
    <Card className={emphasise ? "border-amber-200" : undefined}>
      <Link to={to} className="block p-5 transition-shadow hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-muted-foreground">{label}</p>
            <p className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-foreground">
              {value}
            </p>
          </div>
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
          >
            {icon}
          </div>
        </div>
      </Link>
    </Card>
  );
}