import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Card, CardContent, Skeleton } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types/enums";

/**
 * Route guard.
 *
 * Two checks, both client-side conveniences rather than security: the API
 * enforces authorization on every endpoint regardless. The token is verified
 * against /User/my-profile before the guard decides, so a stale localStorage
 * entry cannot grant entry.
 */
export function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: UserRole[];
  children: ReactNode;
}) {
  const { user, isAuthenticated, isInitializing } = useAuth();
  const location = useLocation();

  if (isInitializing) {
    return <FullPageSkeleton />;
  }

  if (!isAuthenticated) {
    // Remember where the user was headed so sign-in can return them there.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (user && !allowedRoles.includes(user.UserRole)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function FullPageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-sm">
        <CardContent className="space-y-3 p-6">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    </div>
  );
}