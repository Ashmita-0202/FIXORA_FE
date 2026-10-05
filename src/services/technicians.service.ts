import { apiClient } from "@/lib/api-client";
import type {
  AddTechnicianRequest,
  Earnings,
  RejectTechnicianRequest,
  Technician,
  UpdateTechnicianProfileRequest,
} from "@/types/api";

/**
 * Technicians.
 *
 * REMINDER: `Technician.Id` is a TechnicianProfile id, while `Technician.UserId`
 * is a User id. Approve/reject/toggle take the profile id; reviews are fetched
 * with the user id. Mixing them up is silent — every route still resolves, it
 * just returns the wrong record or a 404.
 */

/** Admin: create a technician account in Pending/inactive state. */
export async function addTechnician(
  payload: AddTechnicianRequest,
): Promise<Technician> {
  const { data } = await apiClient.post<Technician>("/Technician", payload);
  return data;
}

export async function getMyTechnicianProfile(): Promise<Technician> {
  const { data } = await apiClient.get<Technician>("/Technician/my-profile");
  return data;
}

export async function updateMyTechnicianProfile(
  payload: UpdateTechnicianProfileRequest,
): Promise<Technician> {
  const { data } = await apiClient.put<Technician>(
    "/Technician/my-profile",
    payload,
  );
  return data;
}

export async function getEarnings(): Promise<Earnings> {
  const { data } = await apiClient.get<Earnings>("/Technician/my-earnings");
  return data;
}

/** Admin: applications awaiting review, oldest first. */
export async function getPendingApplications(): Promise<Technician[]> {
  const { data } = await apiClient.get<Technician[]>(
    "/Technician/pending-applications",
  );
  return data;
}

/** Admin: always filtered to Approved on the server, regardless of activeOnly. */
export async function listTechnicians(activeOnly?: boolean): Promise<Technician[]> {
  const { data } = await apiClient.get<Technician[]>("/Technician", {
    params: activeOnly == null ? undefined : { activeOnly },
  });
  return data;
}

/** `profileId` is TechnicianProfile.Id, i.e. Technician.Id — not UserId. */
export async function approveTechnician(profileId: string): Promise<Technician> {
  const { data } = await apiClient.patch<Technician>(
    `/Technician/${profileId}/approve`,
  );
  return data;
}

/** `profileId` is TechnicianProfile.Id, i.e. Technician.Id — not UserId. */
export async function rejectTechnician(
  profileId: string,
  reason?: string | null,
): Promise<Technician> {
  const payload: RejectTechnicianRequest = { Reason: reason ?? null };
  const { data } = await apiClient.patch<Technician>(
    `/Technician/${profileId}/reject`,
    payload,
  );
  return data;
}

/** `profileId` is TechnicianProfile.Id, i.e. Technician.Id — not UserId. */
export async function toggleTechnicianActive(
  profileId: string,
): Promise<Technician> {
  const { data } = await apiClient.patch<Technician>(
    `/Technician/${profileId}/toggle-active`,
  );
  return data;
}