import { apiClient } from "@/lib/api-client";
import type {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  MessageResponse,
  ResetPasswordRequest,
} from "@/types/api";

/**
 * Auth API.
 *
 * The backend exposes exactly three anonymous auth endpoints — there is no
 * register, refresh, logout or /me route here:
 *   - register lives at POST /api/User/AddUser (see user.service.ts)
 *   - "me" lives at GET /api/User/my-profile (also in user.service.ts)
 */

export async function login(payload: LoginRequest): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>("/Auth/Login", payload);
  return data;
}

export async function forgotPassword(
  payload: ForgotPasswordRequest,
): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>(
    "/Auth/ForgotPassword",
    payload,
  );
  return data;
}

export async function resetPassword(
  payload: ResetPasswordRequest,
): Promise<MessageResponse> {
  const { data } = await apiClient.post<MessageResponse>(
    "/Auth/ResetPassword",
    payload,
  );
  return data;
}