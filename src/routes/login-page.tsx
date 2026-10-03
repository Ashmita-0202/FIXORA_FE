import { useState } from "react";
import { Navigate, Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn, Star } from "lucide-react";
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

/**
 * Sign in.
 *
 * The backend returns the technician approval status on the login response, so
 * a Pending technician is allowed in but sees their portal with requests hidden —
 * rejecting them at the door would be a lie about state the client can verify.
 */
export function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) {
    const from = (location.state as { from?: string } | null)?.from;
    return <Navigate to={from ?? "/"} replace />;
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const user = await login(email.trim(), password);
      navigate(homePathFor(user.UserRole), { replace: true });
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Sign in failed. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-emerald-600">
            <Star className="size-7 text-white" fill="currentColor" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight text-foreground">
              Welcome back
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in to your Fixora account
            </p>
          </div>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                <LogIn />
                {isSubmitting ? "Signing in…" : "Sign in"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          New to Fixora?{" "}
          <Link to="/signup" className="font-semibold text-blue-700 hover:underline">
            Create an account
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          Technicians are added by an admin and must be approved before they can accept
          job requests.
        </p>
      </div>
    </div>
  );
}

/** Landing target per role. */
export function homePathFor(role: number): string {
  switch (role) {
    case 1:
      return "/admin";
    case 2:
      return "/technician";
    default:
      return "/customer";
  }
}