import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { EarningsJobItem } from "@/types/api";
import { formatAmount } from "@/lib/format";

/**
 * Monthly earnings area chart.
 *
 * The API has no time-series endpoint — GET /Technician/my-earnings returns only
 * a few scalars plus the most recent completed jobs. The prototype's 6-month
 * area chart is therefore built by bucketing Earnings.RecentJobs by month, which
 * shows a real, if partial, history rather than inventing numbers. Months with
 * no completed job render as zero instead of being skipped, so the x-axis stays
 * evenly spaced.
 */

const MONTHS_SHOWN = 6;
const MONTH_FORMATTER = new Intl.DateTimeFormat("en-GB", { month: "short" });

export interface EarningsPoint {
  /** e.g. "Aug" */
  label: string;
  /** Full key for the tooltip, e.g. "Aug 2026". */
  month: string;
  earnings: number;
}

export function buildMonthlyEarnings(jobs: EarningsJobItem[]): EarningsPoint[] {
  // Start from the current month and walk backwards, so the axis is stable even
  // when there is no data at all.
  const now = new Date();
  const buckets = new Map<string, number>();

  for (let offset = MONTHS_SHOWN - 1; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    buckets.set(monthKey(date), 0);
  }

  for (const job of jobs) {
    const completedAt = new Date(job.CompletedAt);
    if (Number.isNaN(completedAt.getTime())) continue;

    const key = monthKey(completedAt);
    // Jobs older than the visible window are ignored rather than creating an
    // off-axis bucket.
    if (!buckets.has(key)) continue;

    buckets.set(key, (buckets.get(key) ?? 0) + job.Amount);
  }

  return [...buckets.entries()].map(([key, earnings]) => {
    const [year, month] = key.split("-").map(Number);
    const date = new Date(year, month - 1, 1);
    return {
      label: MONTH_FORMATTER.format(date),
      month: `${MONTH_FORMATTER.format(date)} ${year}`,
      earnings,
    };
  });
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth() + 1}`;
}

export function EarningsChart({ jobs }: { jobs: EarningsJobItem[] }) {
  const data = buildMonthlyEarnings(jobs);

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="earningsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            dy={8}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            width={56}
            tickFormatter={(value: number) => formatAmount(value)}
          />
          <Tooltip
            cursor={{ stroke: "var(--chart-1)", strokeDasharray: "4 4" }}
            content={<EarningsTooltip />}
          />
          <Area
            type="monotone"
            dataKey="earnings"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill="url(#earningsFill)"
            dot={false}
            activeDot={{ r: 4, fill: "var(--chart-1)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function EarningsTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: EarningsPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-md">
      <p className="text-xs font-medium text-muted-foreground">{point.month}</p>
      <p className="text-sm font-semibold text-foreground">
        NPR {formatAmount(point.earnings)}
      </p>
    </div>
  );
}