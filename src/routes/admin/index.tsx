import { lazy } from "react";

const AdminLayout = lazy(() =>
  import("@/routes/admin/layout").then((m) => ({ default: m.AdminLayout })),
);

const AdminDashboardPage = lazy(() =>
  import("@/routes/admin/dashboard-page").then((m) => ({
    default: m.AdminDashboardPage,
  })),
);

const AdminApplicationsPage = lazy(() =>
  import("@/routes/admin/applications-page").then((m) => ({
    default: m.TechnicianApplicationsPage,
  })),
);

const AdminTechniciansPage = lazy(() =>
  import("@/routes/admin/technicians-page").then((m) => ({
    default: m.AdminTechniciansPage,
  })),
);

const AdminBookingsPage = lazy(() =>
  import("@/routes/admin/bookings-page").then((m) => ({
    default: m.AdminBookingsPage,
  })),
);

const AdminCustomersPage = lazy(() =>
  import("@/routes/admin/customers-page").then((m) => ({
    default: m.AdminCustomersPage,
  })),
);

const AdminServicesPage = lazy(() =>
  import("@/routes/admin/services-page").then((m) => ({
    default: m.AdminServicesPage,
  })),
);

export {
  AdminApplicationsPage,
  AdminBookingsPage,
  AdminCustomersPage,
  AdminDashboardPage,
  AdminLayout,
  AdminServicesPage,
  AdminTechniciansPage,
};