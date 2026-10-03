import { apiClient } from "@/lib/api-client";
import type {
  AppNotification,
  CreateReviewRequest,
  MessageResponse,
  Review,
} from "@/types/api";

/* -------------------------------------------------------------------------- */
/*  Notifications                                                               */
/* -------------------------------------------------------------------------- */

export async function listNotifications(unreadOnly?: boolean): Promise<AppNotification[]> {
  const { data } = await apiClient.get<AppNotification[]>("/Notification", {
    params: unreadOnly == null ? undefined : { unreadOnly },
  });
  return data;
}

export async function markNotificationRead(id: string): Promise<AppNotification> {
  const { data } = await apiClient.patch<AppNotification>(
    `/Notification/${id}/read`,
  );
  return data;
}

export async function markAllNotificationsRead(): Promise<MessageResponse> {
  const { data } = await apiClient.patch<MessageResponse>(
    "/Notification/read-all",
  );
  return data;
}

/* -------------------------------------------------------------------------- */
/*  Reviews                                                                     */
/* -------------------------------------------------------------------------- */

/** Customer only. Booking must be Completed and have an assigned technician. */
export async function createReview(payload: CreateReviewRequest): Promise<Review> {
  const { data } = await apiClient.post<Review>("/Review", payload);
  return data;
}

/**
 * `technicianId` is a USER id (Review.TechnicianId), not TechnicianProfile.Id.
 * Use Technician.UserId here — see types/api.ts for the full explanation.
 */
export async function listTechnicianReviews(
  technicianId: string,
): Promise<Review[]> {
  const { data } = await apiClient.get<Review[]>(
    `/Review/technician/${technicianId}`,
  );
  return data;
}