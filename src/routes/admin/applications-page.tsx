import { useCallback } from "react";
import { UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { useApiData } from "@/hooks/useApiData";
import { getPendingApplications } from "@/services/technicians.service";
import type { Technician } from "@/types/api";
import { ApplicationActions, TechnicianCard } from "./technician-card";

/**
 * Pending technician applications.
 *
 * The list is refetched after every approve/reject rather than patching local
 * state, because approving also changes IsActive on the server and the
 * technicians page reflects that — a local splice would leave the two screens
 * disagreeing.
 */
export function TechnicianApplicationsPage() {
  const loader = useCallback(() => getPendingApplications(), []);
  const { data, isLoading, error, refetch } = useApiData<Technician[]>(loader, []);

  const applications = data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          Technician applications
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Approve or reject applicants. Approved technicians become visible to customers
          but still need activating before they can accept jobs.
        </p>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <LoadingState rows={3} />
      ) : applications.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              title="No pending applications"
              description="New technician applications will appear here for review."
              icon={<UserCheck className="size-6" />}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {applications.map((technician) => (
            <TechnicianCard
              key={technician.Id}
              technician={technician}
              actions={<ApplicationActions technician={technician} onSettled={() => void refetch()} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}