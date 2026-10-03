import { Navigate, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { LoginPage, homePathFor } from "@/routes/login-page";
import { ProtectedRoute } from "@/routes/protected-route";
import { TechnicianLayout } from "@/routes/technician/layout";
import { TechnicianDashboardPage } from "@/routes/technician/dashboard-page";
import { TechnicianEarningsPage } from "@/routes/technician/earnings-page";
import { TechnicianJobDetailPage } from "@/routes/technician/job-detail-page";
import { TechnicianJobsPage } from "@/routes/technician/jobs-page";
import { TechnicianProfilePage } from "@/routes/technician/profile-page";
import { TechnicianRequestsPage } from "@/routes/technician/requests-page";
import { TechnicianSchedulePage } from "@/routes/technician/schedule-page";
import { UserRole } from "@/types/enums";

/**
 * Route table.
 *
 * Only the technician portal is implemented; `/admin` and `/customer` render a
 * placeholder until those portals are built, rather than a 404 — the nav config
 * already declares their routes (see config/navigation.ts).
 */
export function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/technician"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Technician]}>
              <TechnicianLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<TechnicianDashboardPage />} />
          <Route path="requests" element={<TechnicianRequestsPage />} />
          <Route path="jobs" element={<TechnicianJobsPage />} />
          <Route path="jobs/:id" element={<TechnicianJobDetailPage />} />
          <Route path="schedule" element={<TechnicianSchedulePage />} />
          <Route path="earnings" element={<TechnicianEarningsPage />} />
          <Route path="profile" element={<TechnicianProfilePage />} />
        </Route>

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin]}>
              <PlaceholderPortal title="Admin portal" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/*"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Customer]}>
              <PlaceholderPortal title="Customer portal" />
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<RoleLanding />} />
        <Route path="*" element={<RoleLanding />} />
      </Routes>
    </TooltipProvider>
  );
}

/** Sends the user to the portal for their role, or to sign-in when anonymous. */
function RoleLanding() {
  const { user, isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) return <div className="min-h-screen bg-background" />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;
  return <Navigate to={homePathFor(user.UserRole)} replace />;
}

function PlaceholderPortal({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md space-y-2 text-center">
        <h1 className="font-display text-2xl font-extrabold text-foreground">{title}</h1>
        <p className="text-sm text-muted-foreground">
          This portal is not built yet. The technician portal is complete and available
          at <span className="font-medium">/technician</span>.
        </p>
      </div>
    </div>
  );
}