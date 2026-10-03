import { CalendarCheck, ClipboardList, TrendingUp, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from "@/components/ui";
import { EmptyState, ErrorState, LoadingState, StatCardSkeleton } from "@/components/feedback";
import { useAuth } from "@/context/AuthContext";
import { firstNameOf, formatCurrency, greetingFor } from "@/lib/format";
import { EarningsChart } from "./earnings-chart";
import { JobRowCompact } from "./job-row";
import { useTechnicianDashboard } from "./useTechnicianDashboard";

/**
 * Technician dashboard.
 *
 * Layout follows the prototype: greeting, four stat tiles, then a two-column
 * grid of "New Requests" / "Today's Jobs" beside a full-width earnings chart.
 * Every tile reflects real API data — the prototype's hardcoded counts are gone.
 */
export function TechnicianDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useTechnicianDashboard();

  const firstName = firstNameOf(user ? `${user.FirstName} ${user.LastName}` : null);

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeading firstName={firstName} />
        <ErrorState message={error} onRetry={() => void refetch()} />
      </div>
    );
  }

  const pendingCount = data?.pendingRequests.length ?? 0;
  const activeCount = data?.activeJobs.length ?? 0;
  const completedTodayCount = data?.completedToday.length ?? 0;
  const monthEarnings = data?.earnings?.ThisMonthEarnings ?? 0;

  return (
    <div className="space-y-6">
      <PageHeading firstName={firstName} />

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
              label="Pending Requests"
              value={String(pendingCount)}
              icon={<ClipboardList className="size-5" />}
              iconClassName="bg-blue-100 text-blue-600"
              to="/technician/requests"
            />
            <StatTile
              label="Active Jobs"
              value={String(activeCount)}
              icon={<Wrench className="size-5" />}
              iconClassName="bg-purple-100 text-purple-600"
              to="/technician/jobs"
            />
            <StatTile
              label="Completed Today"
              value={String(completedTodayCount)}
              icon={<CalendarCheck className="size-5" />}
              iconClassName="bg-emerald-100 text-emerald-600"
            />
            <StatTile
              label="This Month"
              value={formatCurrency(monthEarnings)}
              icon={<TrendingUp className="size-5" />}
              iconClassName="bg-amber-100 text-amber-600"
              to="/technician/earnings"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* New Requests */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base">New Requests</CardTitle>
              <CardDescription>Jobs waiting to be accepted</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/technician/requests">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <LoadingState rows={3} />
            ) : data.pendingRequests.length === 0 ? (
              <EmptyState
                title="No new requests"
                description="When a customer books one of your services it will appear here."
                icon={<ClipboardList className="size-6" />}
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {data.pendingRequests.slice(0, 3).map((booking) => (
                  <JobRowCompact key={booking.Id} booking={booking} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Today's Jobs */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle className="text-base">Today's Jobs</CardTitle>
              <CardDescription>Your schedule for today</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/technician/schedule">Schedule</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading || !data ? (
              <LoadingState rows={3} />
            ) : todayJobs(data.activeJobs).length === 0 ? (
              <EmptyState
                title="Nothing scheduled today"
                description="Accepted jobs appear here on the day they are booked for."
                icon={<CalendarCheck className="size-6" />}
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {todayJobs(data.activeJobs)
                  .slice(0, 3)
                  .map((booking) => (
                    <JobRowCompact key={booking.Id} booking={booking} />
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Earnings chart */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle className="text-base">Monthly Earnings</CardTitle>
            <CardDescription>Last six months of completed jobs</CardDescription>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/technician/earnings">Details</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading || !data ? (
            <Skeleton className="h-[260px] w-full" />
          ) : data.earningsError || !data.earnings ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {data.earningsError ?? "No earnings data yet."}
            </p>
          ) : data.earnings.JobsCompleted === 0 ? (
            <EmptyState
              title="No completed jobs yet"
              description="Your earnings chart will fill in as jobs are completed."
              icon={<TrendingUp className="size-6" />}
            />
          ) : (
            <EarningsChart jobs={data.earnings.RecentJobs} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PageHeading({ firstName }: { firstName: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
        {greetingFor()}, {firstName}!
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Here is what is happening with your jobs today.
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
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconClassName: string;
  to?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-muted-foreground">{label}</p>
          <p className="mt-1.5 font-display text-2xl font-extrabold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        <div className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}>
          {icon}
        </div>
      </div>
    </>
  );

  if (to) {
    return (
      <Card className="transition-shadow hover:shadow-md">
        <Link to={to} className="block p-5">
          {body}
        </Link>
      </Card>
    );
  }

  return <Card className="p-5">{body}</Card>;
}

/** Active jobs whose ScheduledDate falls on today, in schedule order. */
function todayJobs<T extends { ScheduledDate: string; ScheduledTime: string }>(jobs: T[]): T[] {
  const now = new Date();
  const isToday = (value: string) => {
    const date = new Date(value);
    return (
      !Number.isNaN(date.getTime()) &&
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  };

  return jobs
    .filter((job) => isToday(job.ScheduledDate))
    .sort((a, b) => a.ScheduledTime.localeCompare(b.ScheduledTime));
}