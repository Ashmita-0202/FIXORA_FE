import { useCallback, useState } from "react";
import { Pencil, Plus, Tag, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Switch,
  Textarea,
} from "@/components/ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { useApiData, useMutation } from "@/hooks/useApiData";
import { formatCurrency } from "@/lib/format";
import {
  createService,
  deleteService,
  listServices,
  toggleServiceStatus,
  updateService,
} from "@/services/categories.service";
import type { CreateServiceCategoryRequest, ServiceCategory } from "@/types/api";

/**
 * Service catalogue administration.
 *
 * `BaseServiceCharge` is what Booking.Amount is derived from when a booking is
 * created, so editing it here only affects future bookings — existing bookings
 * store their own Amount and are never recalculated.
 *
 * Deletion is a hard delete with no soft-delete alternative in the API. Bookings
 * hold a foreign key to their category, so a service that has ever been booked
 * cannot be removed; the confirm dialog explains that instead of letting the
 * request fail with a raw constraint error.
 *
 * New services are created active, so they are immediately bookable.
 */
export function AdminServicesPage() {
  const [editing, setEditing] = useState<ServiceCategory | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleting, setDeleting] = useState<ServiceCategory | null>(null);

  const loader = useCallback(() => listServices(), []);
  const { data, isLoading, error, refetch, setData } = useApiData<ServiceCategory[]>(
    loader,
    [],
  );

  const toggle = useMutation(async (service: ServiceCategory) => {
    // The API returns only { Id, IsActive }, so the row is patched from that
    // rather than replaced by the response.
    const result = await toggleServiceStatus(service.Id);
    setData((current) =>
      current?.map((item) =>
        item.Id === result.Id ? { ...item, IsActive: result.IsActive } : item,
      ) ?? current,
    );
    toast.success(result.IsActive ? `${service.CategoryName} enabled` : `${service.CategoryName} disabled`);
    return result;
  });

  const remove = useMutation(async (service: ServiceCategory) => {
    await deleteService(service.Id);
    setData((current) => current?.filter((item) => item.Id !== service.Id) ?? current);
    toast.success(`${service.CategoryName} deleted`);
    setDeleting(null);
    return service;
  });

  const services = data ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
            Services
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            The catalogue customers book from. Disabling a service hides it from new
            bookings without affecting existing ones.
          </p>
        </div>

        <Button
          onClick={() => {
            setEditing(null);
            setIsFormOpen(true);
          }}
        >
          <Plus />
          Add service
        </Button>
      </div>

      {(toggle.error || remove.error) && (
        <ErrorState
          message={toggle.error ?? remove.error ?? ""}
          onRetry={() => {
            toggle.reset();
            remove.reset();
          }}
        />
      )}

      {error ? (
        <ErrorState message={error} onRetry={() => void refetch()} />
      ) : isLoading ? (
        <LoadingState rows={3} />
      ) : services.length === 0 ? (
        <Card>
          <CardContent className="py-0">
            <EmptyState
              title="No services configured"
              description="Add your first service so customers can book it."
              icon={<Tag className="size-6" />}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {services.map((service) => (
            <ServiceCard
              key={service.Id}
              service={service}
              isToggling={toggle.isPending}
              onToggle={() => void toggle.mutate(service)}
              onEdit={() => {
                setEditing(service);
                setIsFormOpen(true);
              }}
              onDelete={() => setDeleting(service)}
            />
          ))}
        </div>
      )}

      <ServiceFormDialog
        open={isFormOpen}
        service={editing}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setEditing(null);
        }}
        onSaved={() => void refetch()}
      />

      <DeleteServiceDialog
        service={deleting}
        isPending={remove.isPending}
        error={remove.error}
        onOpenChange={(open) => !open && setDeleting(null)}
        onConfirm={() => {
          if (deleting) void remove.mutate(deleting);
        }}
      />
    </div>
  );
}

function ServiceCard({
  service,
  isToggling,
  onToggle,
  onEdit,
  onDelete,
}: {
  service: ServiceCategory;
  isToggling: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className={service.IsActive ? undefined : "bg-slate-50/60"}>
      <CardContent className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground">{service.CategoryName}</h3>
            {service.Description && (
              <p className="mt-1 text-sm text-muted-foreground">{service.Description}</p>
            )}
          </div>
          <label className="flex shrink-0 items-center gap-2 text-xs font-medium text-muted-foreground">
            <span className="sr-only sm:not-sr-only">{service.IsActive ? "Active" : "Disabled"}</span>
            <Switch
              checked={service.IsActive}
              disabled={isToggling}
              onCheckedChange={onToggle}
              aria-label={`${service.IsActive ? "Disable" : "Enable"} ${service.CategoryName}`}
            />
          </label>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Base charge</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {formatCurrency(service.BaseServiceCharge)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Duration</dt>
            <dd className="mt-0.5 font-medium text-foreground">
              {service.EstimatedDuration || "—"}
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex flex-wrap items-center gap-1 pt-1">
          <Button variant="ghost" size="sm" onClick={onEdit}>
            <Pencil />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:bg-red-50"
            onClick={onDelete}
          >
            <Trash2 />
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ServiceFormDialog({
  open,
  service,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  /** null means "create a new service". */
  service: ServiceCategory | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [baseCharge, setBaseCharge] = useState("");
  const [duration, setDuration] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  // Reset whenever the dialog opens, so a previous edit never leaks into a new one.
  const handleOpenChange = (next: boolean) => {
    if (next) {
      setName(service?.CategoryName ?? "");
      setDescription(service?.Description ?? "");
      setBaseCharge(service ? String(service.BaseServiceCharge) : "");
      setDuration(service?.EstimatedDuration ?? "");
      setLocalError(null);
    }
    onOpenChange(next);
  };

  const save = useMutation(async () => {
    const payload: CreateServiceCategoryRequest = {
      CategoryName: name.trim(),
      Description: description.trim() || null,
      IconUrl: null,
      BaseServiceCharge: Number(baseCharge),
      EstimatedDuration: duration.trim() || null,
      IsActive: service?.IsActive ?? true,
    };

    if (service) {
      await updateService(service.Id, payload);
      toast.success(`${payload.CategoryName} updated`);
    } else {
      await createService(payload);
      toast.success(`${payload.CategoryName} added`);
    }
    onSaved();
    handleOpenChange(false);
    return payload;
  });

  const handleSubmit = async () => {
    if (!name.trim()) {
      setLocalError("A name is required.");
      return;
    }
    const charge = Number(baseCharge);
    if (baseCharge.trim() === "" || !Number.isFinite(charge) || charge < 0) {
      setLocalError("Enter a base charge of zero or more.");
      return;
    }
    setLocalError(null);
    await save.mutate();
  };

  const error = localError ?? save.error;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{service ? "Edit service" : "Add service"}</DialogTitle>
          <DialogDescription>
            {service
              ? "Changes apply to future bookings only. Existing bookings keep the amount they were created with."
              : "New services are created active, so they are immediately bookable."}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="service-name">Name</Label>
            <Input
              id="service-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Deep Cleaning"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="service-description">Description</Label>
            <Textarea
              id="service-description"
              rows={3}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What the service includes"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="service-charge">Base charge</Label>
              <Input
                id="service-charge"
                type="number"
                min={0}
                step="0.01"
                value={baseCharge}
                onChange={(event) => setBaseCharge(event.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="service-duration">Estimated duration</Label>
              <Input
                id="service-duration"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                placeholder="e.g. 2-3 hours"
              />
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={save.isPending} onClick={() => void handleSubmit()}>
            {save.isPending ? "Saving…" : service ? "Save changes" : "Add service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeleteServiceDialog({
  service,
  isPending,
  error,
  onOpenChange,
  onConfirm,
}: {
  service: ServiceCategory | null;
  isPending: boolean;
  error: string | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={service !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete {service?.CategoryName}?</DialogTitle>
          <DialogDescription>
            This permanently removes the service. If any booking references it the server
            will refuse the request — disable the service instead to keep booking history
            intact.
          </DialogDescription>
        </DialogHeader>

        {error && <p className="mt-4 text-sm font-medium text-red-600">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="danger" disabled={isPending} onClick={onConfirm}>
            {isPending ? "Deleting…" : "Delete service"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}