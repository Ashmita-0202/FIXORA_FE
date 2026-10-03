import { useCallback } from "react";
import { CalendarCheck, TrendingUp, Wallet } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui";
import { EmptyState, ErrorState, LoadingState, StatCardSkeleton } from "@/components/feedback";
import { useApiData } from "@/hooks/useApiData";
import { getEarnings } from "@/services/technicians.service";
import { formatCurrency, formatDate } from "@/lib/format";
import { EarningsChart } from "./earnings-chart";

/**
 * Earnings.
 *
 * Totals come straight from GET /Technician/my-earnings. Note that
 * TotalEarnings and JobsCompleted are lifetime figures, while RecentJobs only
 * carries the most recent completions — so the chart is a partial history, not
 * the basis for the headline numbers.
 */
export function TechnicianEarningsPage() {
  const loader = useCallback(() => getEarnings(), []);
  const { data, isLoading, error, refetch } = useApiData(loader, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          Earnings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your completed-job income and recent payouts.
        </p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {isLoading || !data ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <Tile
                  label="Total Earnings"
                  value={formatCurrency(data.TotalEarnings)}
                  icon={<Wallet className="size-5" />}
                  iconClassName="bg-emerald-100 text-emerald-600"
                />
                <Tile
                  label="This Month"
                  value={formatCurrency(data.ThisMonthEarnings)}
                  icon={<TrendingUp className="size-5" />}
                  iconClassName="bg-blue-100 text-blue-600"
                />
                <Tile
                  label="Jobs Completed"
                  value={String(data.JobsCompleted)}
                  icon={<CalendarCheck className="size-5" />}
                  iconClassName="bg-purple-100 text-purple-600"
                />
              </>
            )}
          </div>

          <Card>
            <CardHeader>
              <div>
                <CardTitle className="text-base">Monthly Earnings</CardTitle>
                <CardDescription>Based on your most recent completed jobs</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading || !data ? (
                <LoadingState rows={2} />
              ) : data.RecentJobs.length === 0 ? (
                <EmptyState
                  title="No completed jobs yet"
                  description="The chart fills in once you complete your first job."
                  icon={<TrendingUp className="size-6" />}
                />
              ) : (
                <EarningsChart jobs={data.RecentJobs} />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle className="text-base">Recent Jobs</CardTitle>
                <CardDescription>Your latest completed work</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading || !data ? (
                <div className="p-5">
                  <LoadingState rows={3} />
                </div>
              ) : data.RecentJobs.length === 0 ? (
                <EmptyState
                  title="Nothing here yet"
                  description="Completed jobs and their amounts will be listed here."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Service</TableHead>
                      <TableHead>Completed</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.RecentJobs.map((job) => (
                      <TableRow key={job.BookingId}>
                        <TableCell className="font-medium text-foreground">
                          {job.ServiceName}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatDate(job.CompletedAt)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(job.Amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Tile({
  label,
  value,
  icon,
  iconClassName,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconClassName: string;
}) {
  return (
    <Card className="p-5">
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
    </Card>
  );
}