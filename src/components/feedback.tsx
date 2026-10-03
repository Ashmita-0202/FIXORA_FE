import { AlertCircle, Inbox, RefreshCw } from "lucide-react";
import type { ReactNode } from "react";
import { Alert, Button, Card, CardContent, Skeleton } from "@/components/ui";

/**
 * Shared loading / empty / error states.
 *
 * Every list and panel in the portal renders through these so the dashboard and
 * the sub-pages behave identically while data is in flight or unavailable.
 */

export function LoadingState({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full" />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return <Skeleton className="h-[104px] w-full" />;
}

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icon ?? <Inbox className="size-6" />}
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        {description && <p className="mx-auto max-w-sm text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * Renders an API failure inline, with a retry affordance. The message is already
 * human-readable — api-client normalizes the backend's several error shapes.
 */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle />
      <div className="flex-1 space-y-2">
        <p className="font-medium">{message}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-1">
            <RefreshCw />
            Try again
          </Button>
        )}
      </div>
    </Alert>
  );
}

/** Full-panel error, for when the whole page failed to load. */
export function PageErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Card>
      <CardContent className="py-8">
        <ErrorState message={message} onRetry={onRetry} />
      </CardContent>
    </Card>
  );
}