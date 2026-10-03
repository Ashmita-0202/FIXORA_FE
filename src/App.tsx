import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui";
import { useAuth } from "@/context/AuthContext";
import { LoginPage, homePathFor } from "@/routes/login-page";
import { FullPageSkeleton, ProtectedRoute } from "@/routes/protected-route";
import { CustomerLayout } from "@/routes/customer/layout";
import { TechnicianLayout } from "@/routes/technician/layout";
import { UserRole } from "@/types/enums";

/**
 * Pages are code-split per route.
 *
 * The login and signup screens are eager because they are the first thing an
 * anonymous visitor loads; everything behind a portal guard is loaded on demand,
 * which keeps the initial bundle small and stops the technician/customer/admin
 * code from landing in one shared chunk.
 */
const SignupPage = lazy(() =>
  import("@/routes/signup-page").then((m) => ({ default: m.SignupPage })),
);

const TechnicianDashboardPage = lazy(() =>
  import("@/routes/technician/dashboard-page").then((m) => ({
    default: m.TechnicianDashboardPage,
  })),
);
const TechnicianRequestsPage = lazy(() =>
  import("@/routes/technician/requests-page").then((m) => ({
    default: m.TechnicianRequestsPage,
  })),
);
const TechnicianJobsPage = lazy(() =>
  import("@/routes/technician/jobs-page").then((m) => ({
    default: m.TechnicianJobsPage,
  })),
);
const TechnicianJobDetailPage = lazy(() =>
  import("@/routes/technician/job-detail-page").then((m) => ({
    default: m.TechnicianJobDetailPage,
  })),
);
const TechnicianSchedulePage = lazy(() =>
  import("@/routes/technician/schedule-page").then((m) => ({
    default: m.TechnicianSchedulePage,
  })),
);
const TechnicianEarningsPage = lazy(() =>
  import("@/routes/technician/earnings-page").then((m) => ({
    default: m.TechnicianEarningsPage,
  })),
);
const TechnicianProfilePage = lazy(() =>
  import("@/routes/technician/profile-page").then((m) => ({
    default: m.TechnicianProfilePage,
  })),
);

const CustomerHomePage = lazy(() =>
  import("@/routes/customer/home-page").then((m) => ({
    default: m.CustomerHomePage,
  })),
);
const BookServicePage = lazy(() =>
  import("@/routes/customer/book-service-page").then((m) => ({
    default: m.BookServicePage,
  })),
);
const CustomerBookingsPage = lazy(() =>
  import("@/routes/customer/bookings-page").then((m) => ({
    default: m.CustomerBookingsPage,
  })),
);
const CustomerBookingDetailPage = lazy(() =>
  import("@/routes/customer/booking-detail-page").then((m) => ({
    default: m.CustomerBookingDetailPage,
  })),
);
const CustomerProfilePage = lazy(() =>
  import("@/routes/customer/profile-page").then((m) => ({
    default: m.CustomerProfilePage,
  })),
);

/**
 * Route table.
 *
 * Technician and customer portals are implemented; `/admin` renders a placeholder
 * until that portal is built, rather than a 404 — its nav is already declared in
 * config/navigation.ts.
 */
export function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <Suspense fallback={<FullPageSkeleton />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

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
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={[UserRole.Customer]}>
                <CustomerLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<CustomerHomePage />} />
            <Route path="book" element={<BookServicePage />} />
            <Route path="bookings" element={<CustomerBookingsPage />} />
            <Route path="bookings/:id" element={<CustomerBookingDetailPage />} />
            <Route path="profile" element={<CustomerProfilePage />} />
          </Route>

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={[UserRole.Admin]}>
                <PlaceholderPortal title="Admin portal" />
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<RoleLanding />} />
          <Route path="*" element={<RoleLanding />} />
        </Routes>
      </Suspense>
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
          This portal is not built yet. The technician and customer portals are complete
          and available at <span className="font-medium">/technician</span> and{" "}
          <span className="font-medium">/customer</span>.
        </p>
      </div>
    </div>
  );
}