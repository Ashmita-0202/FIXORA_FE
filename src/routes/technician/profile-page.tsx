import { useCallback, useState } from "react";
import { Save, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import {
  Alert,
  AlertDescription,
  Avatar,
  AvatarFallback,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Skeleton,
} from "@/components/ui";
import { ApprovalStatusBadge } from "@/components/status-badge";
import { ErrorState } from "@/components/feedback";
import { useApiData, useMutation } from "@/hooks/useApiData";
import { useAuth } from "@/context/AuthContext";
import { initialsOf } from "@/lib/format";
import { getMyTechnicianProfile, updateMyTechnicianProfile } from "@/services/technicians.service";
import { getMyProfile, updateMyProfile } from "@/services/user.service";
import type { MyProfile, Technician, UpdateTechnicianProfileRequest } from "@/types/api";

/**
 * Profile.
 *
 * Two independent resources live behind this page: the User record (name, phone,
 * address) and the TechnicianProfile record (specialty, city, experience).
 * They are fetched and saved separately because the API exposes them separately —
 * and because the technician profile 404s until a profile row exists.
 *
 * There is deliberately no availability switch here: the only endpoint that
 * changes active state is Technician/{id}/toggle-active, which is admin-only.
 * A self-service toggle would 403.
 */
export function TechnicianProfilePage() {
  const { refreshUser } = useAuth();

  const userLoader = useCallback(() => getMyProfile(), []);
  const technicianLoader = useCallback(() => getMyTechnicianProfile(), []);

  const userState = useApiData(userLoader, []);
  const technicianState = useApiData(technicianLoader, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
          Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your contact details and the service information customers see.
        </p>
      </div>

      {technicianState.error && (
        <Alert variant="warning">
          <ShieldAlert />
          <AlertDescription>
            {technicianState.error}
          </AlertDescription>
        </Alert>
      )}

      <ContactCard
        key={userState.data?.Id ?? "pending"}
        profile={userState.data}
        onSaved={async () => {
          await userState.refetch();
          await refreshUser();
        }}
      />

      {technicianState.data && (
        <TechnicianDetailsCard
          key={technicianState.data.Id}
          technician={technicianState.data}
          onSaved={() => void technicianState.refetch()}
        />
      )}

      {technicianState.isLoading && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Contact details — GET/PUT /api/User/my-profile                              */
/* -------------------------------------------------------------------------- */

/**
 * Contact details form.
 *
 * The form is mounted with `key={profile.Id}`, so its state is seeded directly
 * from props in the initializer instead of being copied in by an effect. A
 * different profile remounts it; saving keeps the same record, and the form
 * already holds exactly what was persisted.
 */
function ContactCard({
  profile,
  onSaved,
}: {
  profile: MyProfile | null;
  onSaved: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    FirstName: profile?.FirstName ?? "",
    LastName: profile?.LastName ?? "",
    Phone: profile?.Phone ?? "",
    Address: profile?.Address ?? "",
  });

  const save = useMutation(async () => {
    const updated = await updateMyProfile(form);
    toast.success("Contact details updated");
    return updated;
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const updated = await save.mutate();
    if (updated) await onSaved();
  };

  const fullName = `${form.FirstName} ${form.LastName}`.trim();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <Avatar className="size-11">
            <AvatarFallback>{initialsOf(fullName)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-base">Contact details</CardTitle>
            <CardDescription>{profile?.Email ?? "—"}</CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!profile ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {save.error && <ErrorState message={save.error} onRetry={() => save.reset()} />}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="First name" id="first-name">
                <Input
                  id="first-name"
                  required
                  value={form.FirstName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, FirstName: event.target.value }))
                  }
                />
              </Field>

              <Field label="Last name" id="last-name">
                <Input
                  id="last-name"
                  required
                  value={form.LastName}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, LastName: event.target.value }))
                  }
                />
              </Field>

              <Field label="Phone" id="phone">
                <Input
                  id="phone"
                  required
                  type="tel"
                  value={form.Phone}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, Phone: event.target.value }))
                  }
                />
              </Field>

              <Field label="Address" id="address">
                <Input
                  id="address"
                  required
                  value={form.Address}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, Address: event.target.value }))
                  }
                />
              </Field>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={save.isPending}>
                <Save />
                {save.isPending ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Service details — GET/PUT /api/Technician/my-profile                        */
/* -------------------------------------------------------------------------- */

/**
 * Service details form. Mounted with `key={technician.Id}` so the state is
 * seeded from props in the initializer rather than copied in by an effect.
 */
function TechnicianDetailsCard({
  technician,
  onSaved,
}: {
  technician: Technician;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<UpdateTechnicianProfileRequest>({
    Specialty: technician.Specialty,
    City: technician.City,
    ExperienceYears: technician.ExperienceYears,
    Certification: technician.Certification,
  });

  const save = useMutation(async () => {
    const updated = await updateMyTechnicianProfile(form);
    toast.success("Service details updated");
    return updated;
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const updated = await save.mutate();
    if (updated) onSaved();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Service details</CardTitle>
            <CardDescription>
              Specialty, service area and experience shown to customers
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <ApprovalStatusBadge status={technician.ApprovalStatus} />
            {!technician.IsActive && (
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                Deactivated
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {technician.ApprovalStatus === "Rejected" && technician.RejectionReason && (
          <Alert variant="warning" className="mb-4">
            <ShieldAlert />
            <AlertDescription>
              Your application was rejected: {technician.RejectionReason}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {save.error && <ErrorState message={save.error} onRetry={() => save.reset()} />}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Specialty" id="specialty">
              <Input
                id="specialty"
                required
                value={form.Specialty ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, Specialty: event.target.value }))
                }
              />
            </Field>

            <Field label="City" id="city">
              <Input
                id="city"
                required
                value={form.City ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, City: event.target.value }))
                }
              />
            </Field>

            <Field label="Years of experience" id="experience">
              <Input
                id="experience"
                required
                type="number"
                min={0}
                max={60}
                value={form.ExperienceYears ?? 0}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    ExperienceYears: Number(event.target.value),
                  }))
                }
              />
            </Field>

            <Field label="Certification (optional)" id="certification">
              <Input
                id="certification"
                value={form.Certification ?? ""}
                onChange={(event) =>
                  setForm((current) => ({ ...current, Certification: event.target.value }))
                }
              />
            </Field>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              {technician.JobsCompleted} jobs completed ·{" "}
              {technician.AverageRating > 0
                ? `${technician.AverageRating.toFixed(1)} average from ${technician.ReviewCount} reviews`
                : "No reviews yet"}
            </p>
            <Button type="submit" disabled={save.isPending}>
              <Save />
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}