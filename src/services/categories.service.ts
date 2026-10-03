import { apiClient } from "@/lib/api-client";
import type {
  CreateServiceCategoryRequest,
  MessageResponse,
  ServiceCategory,
  ToggleServiceCategoryStatusResponse,
  UpdateServiceCategoryRequest,
} from "@/types/api";

/**
 * Service categories. The backend routes these under /api/Categories and calls
 * them "ServiceCategory" throughout, but they are the customer-facing *services*
 * (AC repair, cooler repair, ...) that bookings are created against.
 */

/**
 * List all services.
 *
 * `activeOnly=true` is what customer-facing pages should pass — it filters out
 * retired categories, which the API would otherwise reject at booking time with
 * "Selected service is not available.".
 */
export async function listServices(
  activeOnly?: boolean,
): Promise<ServiceCategory[]> {
  const { data } = await apiClient.get<ServiceCategory[]>(
    "/Categories/all-ServiceCategory",
    { params: activeOnly == null ? undefined : { activeOnly } },
  );
  return data;
}

export async function getService(id: string): Promise<ServiceCategory> {
  const { data } = await apiClient.get<ServiceCategory>(`/Categories/${id}`);
  return data;
}

export async function createService(
  payload: CreateServiceCategoryRequest,
): Promise<ServiceCategory> {
  const { data } = await apiClient.post<ServiceCategory>(
    "/Categories/AddServiceCategory",
    payload,
  );
  return data;
}

export async function updateService(
  id: string,
  payload: UpdateServiceCategoryRequest,
): Promise<ServiceCategory> {
  const { data } = await apiClient.put<ServiceCategory>(
    `/Categories/${id}`,
    payload,
  );
  return data;
}

export async function toggleServiceStatus(
  id: string,
): Promise<ToggleServiceCategoryStatusResponse> {
  const { data } = await apiClient.patch<ToggleServiceCategoryStatusResponse>(
    `/Categories/${id}/toggle-status`,
  );
  return data;
}

/** Hard delete — the backend offers no soft delete. */
export async function deleteService(id: string): Promise<MessageResponse> {
  const { data } = await apiClient.delete<MessageResponse>(`/Categories/${id}`);
  return data;
}