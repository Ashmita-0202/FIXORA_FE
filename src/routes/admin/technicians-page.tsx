import { useCallback, useState } from "react";
import { Power, UserCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { useApiData, useMutation } from "@/hooks/useApiData";
import { listTechnicians, toggleTechnicianActive } from "@/services/technicians.service";
import type { Technician } from "@/types/api";
import { TechnicianCard } from "./technician-card";

type Filter = "active" | "inactive" | "all";

/**
 * Approved technicians.
 *
 * GET /Technician is filtered to Approved server-side regardless of activeOnly,
 * so pending and rejected applicants are never listed here — they belong on the
 * applications page.
 *
 * Toggling active state hides a technician from job requests without deleting
 * their history, so it is confirmed in a dialog and explains the consequence.
 */
export function AdminTechniciansPage() {
  const [filter, setFilter] = useState<Filter>("all");

  const loader = useCallback(() => listTechnicians(), []);
  const { data, isLoading, error, refetch, setData } = useApiData<Technician[]>(
    loader,
    [],
  );

  const toggle = useMutation(async (technician: Technician) => {
    const updated = await toggleTechnicianActive(technician.Id);
    setData((current) =>
      current?.map((item) => (item.Id === updated.Id ? updated : item)) ?? current,
    );
    toast.success(
      updated.IsActive ? `${updated.Name} activated` : `${updated.Name} deactivated`,
      {
        description: updated.IsActive
          ? "They can now be assigned new job requests."
          : "They will no longer appear in new job requests.",
      },
    );
    return updated;
  });

  const technicians = (data ?? []).filter((technician) => {
    if (filter === "active") return technician.IsActive;
    if (filter === "inactive") return !technician.IsActive;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
            Technicians
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Approved technicians. Deactivating one keeps their history but stops them
            appearing in new job requests.
          </p>
        </div>

        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="inactive">Inactive</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {toggle.error && <ErrorState message={toggle.error} onRetry={() => toggle.reset()} />}

      {error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <LoadingState rows={3} />
      ) : technicians.length === 0 ? (
        <EmptyState
          title={filter === "all" ? "No approved technicians" : `No ${filter} technicians`}
          description={
            filter === "all"
              ? "Approve an application to build your technician roster."
              : "Try a different filter."
          }
          icon={<UserCheck className="size-6" />}
        />
      ) : (
        <div className="space-y-3">
          {technicians.map((technician) => (
            <TechnicianCard
              key={technician.Id}
              technician={technician}
              actions={
                <ActiveToggle
                  technician={technician}
                  isPending={toggle.isPending}
                  onToggle={() => void toggle.mutate(technician)}
                />
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ActiveToggle({
  technician,
  isPending,
  onToggle,
}: {
  technician: Technician;
  isPending: boolean;
  onToggle: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        variant="outline"
        size="sm"
        disabled={isPending}
        onClick={() => setIsOpen(true)}
        aria-label={technician.IsActive ? "Deactivate" : "Activate"}
      >
        <Power />
        {technician.IsActive ? "Deactivate" : "Activate"}
      </Button>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {technician.IsActive ? "Deactivate" : "Activate"} {technician.Name}?
          </DialogTitle>
          <DialogDescription>
            {technician.IsActive
              ? "They will stop appearing in new job requests. Jobs already assigned to them are unaffected."
              : "They will start appearing in new job requests and be able to accept jobs."}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Keep as is
          </Button>
          <Button
            variant={technician.IsActive ? "danger" : "primary"}
            onClick={() => {
              setIsOpen(false);
              onToggle();
            }}
          >
            {technician.IsActive ? "Deactivate" : "Activate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}