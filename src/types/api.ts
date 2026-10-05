import type {
  BookingStatus,
  NotificationType,
  TechnicianApprovalStatus,
  UserRole,
} from "./enums";

/**
 * Wire types for the FIXORA ASP.NET Core API.
 *
 * The backend sets `PropertyNamingPolicy = null` in Program.cs, so every
 * property is PascalCase on the wire. Request binding is case-insensitive, so
 * camelCase request bodies are accepted; these interfaces model the RESPONSE
 * shape and are therefore PascalCase.
 *
 * There is no response envelope. Successful calls return a bare DTO or a bare
 * array — `Result<T>` is unwrapped inside the controllers and never serialized.
 */

/* -------------------------------------------------------------------------- */
/*  Auth                                                                        */
/* -------------------------------------------------------------------------- */

export interface LoginRequest {
  Email: string;
  Password: string;
}

export interface ForgotPasswordRequest {
  Email: string;
}

export interface ResetPasswordRequest {
  Email: string;
  Token: string;
  NewPassword: string;
}

export interface MessageResponse {
  Message: string;
}

export interface LoginResponse {
  Id: string;
  FirstName: string;
  LastName: string;
  Email: string;
  /** Numeric enum. Convert via toUserRoleName() before display. */
  UserRole: UserRole;
  Token: string;
  /** Technician only — null for every other role, and null if the profile row is missing. */
  TechnicianApprovalStatus?: TechnicianApprovalStatus | null;
  /** Technician only — see above. */
  TechnicianIsActive?: boolean | null;
}

/* -------------------------------------------------------------------------- */
/*  User                                                                        */
/* -------------------------------------------------------------------------- */

export interface RegisterRequest {
  FirstName: string;
  LastName: string;
  Address: string;
  Phone: string;
  Email: string;
  Password: string;
  UserRole: UserRole;
  /** Required when UserRole === Technician. Omitting it makes the API throw. */
  Specialty?: string | null;
  /** Required when UserRole === Technician. */
  City?: string | null;
  /** Required (non-null) when UserRole === Technician. */
  ExperienceYears?: number | null;
  Certification?: string | null;
}

export interface RegisterResponse {
  Id: string;
  FirstName: string;
  LastName: string;
  Address: string;
  UserRole: UserRole;
}

export interface MyProfile {
  Id: string;
  FirstName: string;
  LastName: string;
  Email: string;
  Phone: string;
  Address: string;
  /** String here, unlike LoginResponse.UserRole which is numeric. */
  UserRole: string;
  CreatedAt: string | null;
}

export interface UpdateProfileRequest {
  FirstName: string;
  LastName: string;
  Phone: string;
  Address: string;
}

export interface ChangePasswordRequest {
  CurrentPassword: string;
  NewPassword: string;
}

/* -------------------------------------------------------------------------- */
/*  Service categories (the backend calls these "services")                     */
/* -------------------------------------------------------------------------- */

/**
 * Response shape of GET /api/Categories/all-ServiceCategory.
 *
 * Note: this one endpoint serializes with DefaultIgnoreCondition =
 * WhenWritingNull, so Description / IconUrl / EstimatedDuration are OMITTED
 * rather than null. The single-service endpoint returns them as explicit nulls.
 * Hence the optional properties.
 */
export interface ServiceCategory {
  Id: string;
  CategoryName: string;
  Description?: string | null;
  IconUrl?: string | null;
  BaseServiceCharge: number;
  EstimatedDuration?: string | null;
  IsActive: boolean;
}

/**
 * Request body for POST /api/Categories/AddServiceCategory.
 *
 * The backend declares this as a positional record with camelCase parameter
 * names, so it is the only camelCase DTO in the codebase. Binding is
 * case-insensitive so PascalCase also binds correctly.
 */
export interface CreateServiceCategoryRequest {
  CategoryName: string;
  Description?: string | null;
  IconUrl?: string | null;
  BaseServiceCharge: number;
  EstimatedDuration?: string | null;
  IsActive: boolean;
}

export interface UpdateServiceCategoryRequest {
  CategoryName: string;
  Description?: string | null;
  IconUrl?: string | null;
  BaseServiceCharge: number;
  EstimatedDuration?: string | null;
  IsActive: boolean;
}

export interface ToggleServiceCategoryStatusResponse {
  Id: string;
  IsActive: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Bookings                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Amount is computed server-side from ServiceCategory.BaseServiceCharge at
 * creation time. There is no way to set it, and it is not recalculated if the
 * service price changes afterwards.
 */
export interface CreateBookingRequest {
  ServiceCategoryId: string;
  ScheduledDate: string;
  /** Free-form string such as "10:00 AM" — the API stores whatever is sent. */
  ScheduledTime: string;
  Address: string;
  Notes?: string | null;
}

export interface Booking {
  Id: string;
  ServiceCategoryId: string;
  ServiceName: string;
  CustomerId: string;
  CustomerName: string;
  /** Null until a technician accepts the job. */
  TechnicianId: string | null;
  TechnicianName: string | null;
  ScheduledDate: string;
  ScheduledTime: string;
  Address: string;
  Amount: number;
  Notes: string | null;
  Status: BookingStatus;
  CreatedAt: string;
  CompletedAt: string | null;
}

export interface UpdateJobStatusRequest {
  /** Parsed case-insensitively by the API. */
  NewStatus: BookingStatus;
}

/* -------------------------------------------------------------------------- */
/*  Technicians                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * TWO DIFFERENT IDS — this is the easiest thing to get wrong in this codebase.
 *
 *   Technician.Id  = TechnicianProfile.Id  → use for approve / reject /
 *                     toggle-active, which take a `profileId`.
 *   Technician.UserId = User.Id           → use for /api/Review/technician/{id},
 *                     which joins on Review.TechnicianId (a User id).
 */
export interface Technician {
  Id: string;
  UserId: string;
  Name: string;
  Email: string;
  Phone: string;
  Specialty: string;
  City: string;
  ExperienceYears: number;
  Certification: string | null;
  ApprovalStatus: TechnicianApprovalStatus;
  IsActive: boolean;
  RejectionReason: string | null;
  JobsCompleted: number;
  AverageRating: number;
  ReviewCount: number;
  AppliedAt: string;
  ReviewedAt: string | null;
}

export interface AddTechnicianRequest {
  FirstName: string;
  LastName: string;
  Address: string;
  Phone: string;
  Email: string;
  Password: string;
  Specialty: string;
  City: string;
  ExperienceYears: number;
  Certification?: string | null;
}

export interface UpdateTechnicianProfileRequest {
  Specialty: string;
  City: string;
  ExperienceYears: number;
  Certification?: string | null;
}

export interface RejectTechnicianRequest {
  Reason?: string | null;
}

export interface EarningsJobItem {
  BookingId: string;
  ServiceName: string;
  Amount: number;
  CompletedAt: string;
}

export interface Earnings {
  TotalEarnings: number;
  ThisMonthEarnings: number;
  JobsCompleted: number;
  RecentJobs: EarningsJobItem[];
}

/* -------------------------------------------------------------------------- */
/*  Admin                                                                       */
/* -------------------------------------------------------------------------- */

export interface DashboardStats {
  TotalCustomers: number;
  TotalTechnicians: number;
  PendingTechnicianApplications: number;
  TotalBookings: number;
  PendingBookings: number;
  ScheduledBookings: number;
  InProgressBookings: number;
  CompletedBookings: number;
  CancelledBookings: number;
  TotalRevenue: number;
  CompletionRatePercent: number;
}

export interface CustomerSummary {
  Id: string;
  Name: string;
  Email: string;
  Phone: string;
  Address: string;
  TotalBookings: number;
  JoinedAt: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Reviews                                                                     */
/* -------------------------------------------------------------------------- */

export interface CreateReviewRequest {
  BookingId: string;
  /** 1–5 inclusive. */
  Rating: number;
  /** Max 1000 characters. */
  Comment?: string | null;
}

export interface Review {
  Id: string;
  BookingId: string;
  CustomerId: string;
  CustomerName: string;
  /** A User id — matches Booking.TechnicianId, not TechnicianProfile.Id. */
  TechnicianId: string;
  Rating: number;
  Comment: string | null;
  CreatedAt: string;
}

/* -------------------------------------------------------------------------- */
/*  Notifications                                                               */
/* -------------------------------------------------------------------------- */

export interface AppNotification {
  Id: string;
  Type: NotificationType;
  Title: string;
  Body: string;
  IsRead: boolean;
  CreatedAt: string;
}