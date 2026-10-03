import { UserRole } from "@/types/enums";

/**
 * Enum helpers.
 *
 * The API serializes enums as integers with no JsonStringEnumConverter, so every
 * numeric UserRole has to be converted before it reaches the UI. The mapping is
 * done in one place to avoid scattering magic numbers across components.
 */

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  [UserRole.Admin]: "Admin",
  [UserRole.Technician]: "Technician",
  [UserRole.Customer]: "Customer",
};

export function toUserRoleName(role: UserRole): string {
  return USER_ROLE_LABEL[role] ?? "Unknown";
}

/**
 * Accepts either representation. MyProfileResponse sends UserRole as a string
 * while LoginResponse sends it as a number, so any code handling "the current
 * user" has to cope with both.
 */
export function parseUserRole(value: UserRole | string | null | undefined): UserRole | null {
  if (value == null) return null;

  if (typeof value === "number") {
    return value in USER_ROLE_LABEL ? value : null;
  }

  // Match on the label rather than the enum key, since the wire value is the
  // member name ("Technician") rather than the numeric key.
  const entry = Object.entries(USER_ROLE_LABEL).find(([, label]) => label === value);
  return entry ? (Number(entry[0]) as UserRole) : null;
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "number" && value in USER_ROLE_LABEL;
}