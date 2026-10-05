import { useCallback, useState } from "react";
import { Plus, Power, UserCheck } from "lucide-react";
import { toast } from "sonner";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { useApiData, useMutation } from "@/hooks/useApiData";
import {
  addTechnician,
  listTechnicians,
  toggleTechnicianActive,
} from "@/services/technicians.service";
import type { AddTechnicianRequest, Technician } from "@/types/api";
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
  const [isAddOpen, setIsAddOpen] = useState(false);

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
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
            Technicians
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage approved technicians and create accounts for new technicians.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => setIsAddOpen(true)}>
            <Plus />
            Add technician
          </Button>
        </div>
      </div>

      <AddTechnicianDialog open={isAddOpen} onOpenChange={setIsAddOpen} />

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

function AddTechnicianDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [city, setCity] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [certification, setCertification] = useState("");

  const create = useMutation(async (payload: AddTechnicianRequest) => {
    const technician = await addTechnician(payload);
    toast.success(`${technician.Name} added`, {
      description: "The account is pending approval and inactive until you approve it.",
    });
    onOpenChange(false);
    return technician;
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setFirstName("");
      setLastName("");
      setAddress("");
      setPhone("");
      setEmail("");
      setPassword("");
      setSpecialty("");
      setCity("");
      setExperienceYears("");
      setCertification("");
      create.reset();
    }
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const years = Number(experienceYears);
    if (!Number.isInteger(years) || years < 0) return;

    await create.mutate({
      FirstName: firstName.trim(),
      LastName: lastName.trim(),
      Address: address.trim(),
      Phone: phone.trim(),
      Email: email.trim(),
      Password: password,
      Specialty: specialty.trim(),
      City: city.trim(),
      ExperienceYears: years,
      Certification: certification.trim() || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add technician</DialogTitle>
          <DialogDescription>
            Create a technician account. It will be pending and inactive until an
            admin approves it.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="technician-first-name" label="First name">
              <Input
                id="technician-first-name"
                autoComplete="given-name"
                required
                maxLength={100}
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
              />
            </FormField>
            <FormField id="technician-last-name" label="Last name">
              <Input
                id="technician-last-name"
                autoComplete="family-name"
                required
                maxLength={100}
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
              />
            </FormField>
          </div>

          <FormField id="technician-email" label="Email">
            <Input
              id="technician-email"
              type="email"
              autoComplete="email"
              required
              maxLength={100}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="technician-phone" label="Phone">
              <Input
                id="technician-phone"
                type="tel"
                autoComplete="tel"
                required
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </FormField>
            <FormField id="technician-password" label="Temporary password">
              <Input
                id="technician-password"
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </FormField>
          </div>

          <FormField id="technician-address" label="Address">
            <Input
              id="technician-address"
              autoComplete="street-address"
              required
              value={address}
              onChange={(event) => setAddress(event.target.value)}
            />
          </FormField>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="technician-specialty" label="Specialty">
              <Input
                id="technician-specialty"
                required
                value={specialty}
                onChange={(event) => setSpecialty(event.target.value)}
              />
            </FormField>
            <FormField id="technician-city" label="City">
              <Input
                id="technician-city"
                required
                value={city}
                onChange={(event) => setCity(event.target.value)}
              />
            </FormField>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FormField id="technician-experience" label="Experience (years)">
              <Input
                id="technician-experience"
                type="number"
                min={0}
                step={1}
                required
                value={experienceYears}
                onChange={(event) => setExperienceYears(event.target.value)}
              />
            </FormField>
            <FormField id="technician-certification" label="Certification (optional)">
              <Input
                id="technician-certification"
                value={certification}
                onChange={(event) => setCertification(event.target.value)}
              />
            </FormField>
          </div>

          {create.error && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {create.error}
            </p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending ? "Adding…" : "Add technician"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function FormField({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
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