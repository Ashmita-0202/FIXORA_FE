import { useCallback } from "react";
import { useApiData } from "@/hooks/useApiData";
import { getJobRequests, getMyJobs } from "@/services/bookings.service";
import { getEarnings } from "@/services/technicians.service";
import type { Booking, Earnings } from "@/types/api";
import { BookingStatus } from "@/types/enums";

/**
 * Dashboard data.
 *
 * Three independent endpoints are combined here. They are fetched together and
 * each failure is isolated with allSettled, so a broken earnings call still
 * renders the request and job lists rather than failing the whole page — a
 * technician's core job queue must never be hidden behind a stats error.
 */
export interface TechnicianDashboardData {
  pendingRequests: Booking[];
  activeJobs: Booking[];
  completedToday: Booking[];
  earnings: Earnings | null;
  earningsError: string | null;
}

export function useTechnicianDashboard() {
  const loader = useCallback(async (): Promise<TechnicianDashboardData> => {
    const [requests, scheduled, inProgress, completed, earnings] = await Promise.allSettled([
      getJobRequests(),
      getMyJobs(BookingStatus.Scheduled),
      getMyJobs(BookingStatus.InProgress),
      getMyJobs(BookingStatus.Completed),
      getEarnings(),
    ]);

    // Only a total failure of both job lists is worth surfacing as an error.
    if (requests.status === "rejected" && scheduled.status === "rejected") {
      throw requests.reason;
    }

    return {
      pendingRequests: requests.status === "fulfilled" ? requests.value : [],
      activeJobs: [
        ...(scheduled.status === "fulfilled" ? scheduled.value : []),
        ...(inProgress.status === "fulfilled" ? inProgress.value : []),
      ],
      completedToday: filterCompletedToday(
        completed.status === "fulfilled" ? completed.value : [],
      ),
      earnings: earnings.status === "fulfilled" ? earnings.value : null,
      earningsError: earnings.status === "rejected" ? "Earnings could not be loaded." : null,
    };
  }, []);

  const state = useApiData<TechnicianDashboardData>(loader, []);

  return {
    ...state,
    /** Number of unassigned jobs waiting to be accepted — the sidebar badge. */
    pendingRequestCount: state.data?.pendingRequests.length ?? 0,
  };
}

function filterCompletedToday(bookings: Booking[]): Booking[] {
  const now = new Date();
  const isSameDay = (iso: string | null) => {
    if (!iso) return false;
    const date = new Date(iso);
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    );
  };
  return bookings.filter((booking) => isSameDay(booking.CompletedAt));
}