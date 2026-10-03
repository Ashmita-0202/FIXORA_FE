/**
 * Backend enum values, reproduced exactly.
 *
 * IMPORTANT: the API does NOT register a JsonStringEnumConverter, so enums are
 * serialized as their underlying integers on the wire. Two DTOs break that rule
 * and send the member name instead — see the comments on LoginResponse and
 * MyProfile in types/api.ts. Anything typed `UserRole` (number) must be converted
 * through the helpers in lib/enums.ts before being displayed.
 *
 * These are declared as frozen const objects plus a same-named type rather than
 * `enum` declarations, because tsconfig sets `erasableSyntaxOnly` — every type in
 * this project must be removable by simple erasure. Usage is identical:
 *
 *   UserRole.Technician      // value
 *   const role: UserRole     // type
 */

/** Integer enum: UserRole { Admin = 1, Technician = 2, Customer = 3 }. */
export const UserRole = {
  Admin: 1,
  Technician: 2,
  Customer: 3,
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/** Serialized as a string, not a number. */
export const TechnicianApprovalStatus = {
  Pending: "Pending",
  Approved: "Approved",
  Rejected: "Rejected",
} as const;
export type TechnicianApprovalStatus =
  (typeof TechnicianApprovalStatus)[keyof typeof TechnicianApprovalStatus];

export const BookingStatus = {
  Pending: "Pending",
  Scheduled: "Scheduled",
  InProgress: "InProgress",
  Completed: "Completed",
  Cancelled: "Cancelled",
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

/** Only status transitions BookingServices.UpdateJobStatus actually permits. */
export const BOOKING_STATUS_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  [BookingStatus.Pending]: [],
  [BookingStatus.Scheduled]: [BookingStatus.InProgress],
  [BookingStatus.InProgress]: [BookingStatus.Completed],
  [BookingStatus.Completed]: [],
  [BookingStatus.Cancelled]: [],
};

export type NotificationType = "info" | "success" | "warning";