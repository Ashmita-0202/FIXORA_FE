import { apiClient } from "@/lib/api-client";
import type {
  ChangePasswordRequest,
  MyProfile,
  RegisterRequest,
  RegisterResponse,
  UpdateProfileRequest,
} from "@/types/api";

export async function register(payload: RegisterRequest): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>("/User/AddUser", payload);
  return data;
}

export async function getMyProfile(): Promise<MyProfile> {
  const { data } = await apiClient.get<MyProfile>("/User/my-profile");
  return data;
}

export async function updateMyProfile(
  payload: UpdateProfileRequest,
): Promise<MyProfile> {
  const { data } = await apiClient.put<MyProfile>("/User/my-profile", payload);
  return data;
}

/** Returns the refreshed profile; the API reuses MyProfileResponse for this. */
export async function changePassword(
  payload: ChangePasswordRequest,
): Promise<MyProfile> {
  const { data } = await apiClient.post<MyProfile>(
    "/User/change-password",
    payload,
  );
  return data;
}