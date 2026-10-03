import { useCallback, useState } from "react";
import { KeyRound, Save, ShieldAlert } from "lucide-react";
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
import { ErrorState } from "@/components/feedback";
import { useApiData, useMutation } from "@/hooks/useApiData";
import { useAuth } from "@/context/AuthContext";
import { initialsOf } from "@/lib/format";
import { changePassword, getMyProfile, updateMyProfile } from "@/services/user.service";
import type { MyProfile } from "@/types/api";

/**
 * Customer profile.
 *
 * Contact details and password are separate resources with separate endpoints, so
 * they are separate cards that save independently — a failed password change must
 * not discard edits to the address.
 */
export function CustomerProfilePage() {
  const { refreshUser } = useAuth();

  const loader = useCallback(() => getMyProfile(), []);
  const profile = useApiData<MyProfile>(loader, []);

  if (profile.error) {
    return (
      <div className="space-y-6">
        <Heading />
        <ErrorState message={profile.error} onRetry={() => void profile.refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Heading />

      <ContactCard
        key={profile.data?.Id ?? "pending"}
        profile={profile.data}
        onSaved={async () => {
          await profile.refetch();
          await refreshUser();
        }}
      />

      <PasswordCard />
    </div>
  );
}

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
    toast.success("Profile updated");
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

              <Field label="Default address" id="address">
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

            <p className="text-xs text-muted-foreground">
              This address prefills when you book a service; you can override it per booking.
            </p>

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

function PasswordCard() {
  const [form, setForm] = useState({
    CurrentPassword: "",
    NewPassword: "",
    ConfirmPassword: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const change = useMutation(async () => {
    const updated = await changePassword({
      CurrentPassword: form.CurrentPassword,
      NewPassword: form.NewPassword,
    });
    return updated;
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    // Checked here purely to avoid a pointless round trip; the API re-validates.
    if (form.NewPassword !== form.ConfirmPassword) {
      setLocalError("The new passwords do not match.");
      return;
    }
    setLocalError(null);

    const updated = await change.mutate();
    if (updated) {
      toast.success("Password changed");
      // The token stays valid — the API does not invalidate it — but the fields
      // are cleared either way so nothing sensitive lingers in the DOM.
      setForm({ CurrentPassword: "", NewPassword: "", ConfirmPassword: "" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-base">Password</CardTitle>
          <CardDescription>Choose something you have not used elsewhere</CardDescription>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {localError && (
            <Alert variant="destructive">
              <ShieldAlert />
              <AlertDescription>{localError}</AlertDescription>
            </Alert>
          )}
          {change.error && <ErrorState message={change.error} onRetry={() => change.reset()} />}

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Current password" id="current-password">
              <Input
                id="current-password"
                type="password"
                required
                autoComplete="current-password"
                value={form.CurrentPassword}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    CurrentPassword: event.target.value,
                  }))
                }
              />
            </Field>

            <Field label="New password" id="new-password">
              <Input
                id="new-password"
                type="password"
                required
                autoComplete="new-password"
                value={form.NewPassword}
                onChange={(event) =>
                  setForm((current) => ({ ...current, NewPassword: event.target.value }))
                }
              />
            </Field>

            <Field label="Confirm new password" id="confirm-password">
              <Input
                id="confirm-password"
                type="password"
                required
                autoComplete="new-password"
                value={form.ConfirmPassword}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    ConfirmPassword: event.target.value,
                  }))
                }
              />
            </Field>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={change.isPending}>
              <KeyRound />
              {change.isPending ? "Changing…" : "Change password"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Heading() {
  return (
    <div>
      <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
        Profile
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your contact details and account security.
      </p>
    </div>
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