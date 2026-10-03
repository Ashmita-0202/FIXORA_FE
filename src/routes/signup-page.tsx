import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Star, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  CardContent,
  Input,
  Label,
} from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { useMutation } from "@/hooks/useApiData";
import { register } from "@/services/user.service";
import { UserRole } from "@/types/enums";

/**
 * Customer sign-up.
 *
 * Registration is open to customers because POST /api/User/AddUser is anonymous.
 * After registering, the API returns no token — so the form signs in with the
 * same credentials immediately and the user lands in the portal with a session.
 *
 * Technician and admin accounts cannot be created here: those roles exist only
 * through admin approval or seeding, which is why UserRole is hardcoded to
 * Customer rather than being a visible field.
 */
export function SignupPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    FirstName: "",
    LastName: "",
    Email: "",
    Phone: "",
    Address: "",
    Password: "",
    ConfirmPassword: "",
  });
  const [localError, setLocalError] = useState<string | null>(null);

  const submit = useMutation(async () => {
    await register({
      FirstName: form.FirstName.trim(),
      LastName: form.LastName.trim(),
      Email: form.Email.trim(),
      Phone: form.Phone.trim(),
      Address: form.Address.trim(),
      Password: form.Password,
      UserRole: UserRole.Customer,
    });
    return true;
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (form.Password !== form.ConfirmPassword) {
      setLocalError("The passwords do not match.");
      return;
    }
    setLocalError(null);

    const registered = await submit.mutate();
    if (!registered) return;

    // Registration returns no token, so sign in with the same credentials.
    try {
      await login(form.Email.trim(), form.Password);
      toast.success("Welcome to Fixora", {
        description: "Your account is ready.",
      });
      navigate("/customer", { replace: true });
    } catch {
      toast.success("Account created", {
        description: "Sign in with your new credentials.",
      });
      navigate("/login", { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-lg space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-600">
            <Star className="size-7 text-white" fill="currentColor" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
              Create your account
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Book trusted technicians for home and office repairs
            </p>
          </div>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {localError && (
                <Alert variant="destructive">
                  <AlertDescription>{localError}</AlertDescription>
                </Alert>
              )}
              {submit.error && (
                <Alert variant="destructive">
                  <AlertDescription>{submit.error}</AlertDescription>
                </Alert>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="First name" id="first-name">
                  <Input
                    id="first-name"
                    required
                    autoComplete="given-name"
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
                    autoComplete="family-name"
                    value={form.LastName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, LastName: event.target.value }))
                    }
                  />
                </Field>
              </div>

              <Field label="Email" id="email">
                <Input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={form.Email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, Email: event.target.value }))
                  }
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Phone" id="phone">
                  <Input
                    id="phone"
                    type="tel"
                    required
                    autoComplete="tel"
                    placeholder="+977 ..."
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
                    placeholder="Kathmandu"
                    value={form.Address}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, Address: event.target.value }))
                    }
                  />
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Password" id="password">
                  <Input
                    id="password"
                    type="password"
                    required
                    autoComplete="new-password"
                    value={form.Password}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, Password: event.target.value }))
                    }
                  />
                </Field>

                <Field label="Confirm password" id="confirm-password">
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

              <Button type="submit" className="w-full" disabled={submit.isPending}>
                <UserPlus />
                {submit.isPending ? "Creating account…" : "Create account"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-blue-700 hover:underline">
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          Want to work as a technician? Technician accounts are reviewed by an admin
          before they can accept jobs.
        </p>
      </div>
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