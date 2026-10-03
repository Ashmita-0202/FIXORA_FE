import { apiClient } from "@/lib/api-client";
import type { Booking, CreateBookingRequest, UpdateJobStatusRequest } from "@/types/api";
import type { BookingStatus } from "@/types/enums";

/**
 * Bookings.
 *
 * Role-specific reads:
 *   - customer   → myBookings
 *   - technician → jobRequests (unassigned queue) and myJobs
 *   - admin      → allBookings
 *
 * Status query params are parsed case-insensitively server-side, and an
 * unrecognised value is silently ignored rather than rejected — so a typo would
 * quietly return everything. Values below are the enum member names.
 */

export async function createBooking(
  payload: CreateBookingRequest,
): Promise<Booking> {
  const { data } = await apiClient.post<Booking>("/Booking", payload);
  return data;
}

export async function getMyBookings(status?: BookingStatus): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[]>("/Booking/my-bookings", {
    params: status ? { status } : undefined,
  });
  return data;
}

/** Unassigned Pending jobs, ordered by ScheduledDate ascending. */
export async function getJobRequests(): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[]>("/Booking/job-requests");
  return data;
}

export async function getMyJobs(status?: BookingStatus): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[]>("/Booking/my-jobs", {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function getAllBookings(status?: BookingStatus): Promise<Booking[]> {
  const { data } = await apiClient.get<Booking[]>("/Booking/all", {
    params: status ? { status } : undefined,
  });
  return data;
}

/** Ownership is enforced server-side: customer/technician of record, or admin. */
export async function getBooking(id: string): Promise<Booking> {
  const { data } = await apiClient.get<Booking>(`/Booking/${id}`);
  return data;
}

/**
 * Accept an unassigned job. Requires an Approved *and* active technician profile
 * — the API re-checks this live rather than trusting the JWT role claim, so the
 * UI must not rely on role alone to decide whether to show the button.
 */
export async function acceptJob(id: string): Promise<Booking> {
  const { data } = await apiClient.patch<Booking>(`/Booking/${id}/accept`);
  return data;
}

/**
 * Advance a job. The only permitted transitions are
 * Scheduled → InProgress → Completed.
 */
export async function updateJobStatus(
  id: string,
  newStatus: BookingStatus,
): Promise<Booking> {
  const payload: UpdateJobStatusRequest = { NewStatus: newStatus };
  const { data } = await apiClient.patch<Booking>(
    `/Booking/${id}/status`,
    payload,
  );
  return data;
}

/** Customer-initiated. Rejected once the job is InProgress or beyond. */
export async function cancelBooking(id: string): Promise<Booking> {
  const { data } = await apiClient.patch<Booking>(`/Booking/${id}/cancel`);
  return data;
}