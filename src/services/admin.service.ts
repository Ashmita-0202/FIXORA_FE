import { apiClient } from "@/lib/api-client";
import type { CustomerSummary, DashboardStats } from "@/types/api";

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await apiClient.get<DashboardStats>("/Admin/dashboard-stats");
  return data;
}

export async function listCustomers(): Promise<CustomerSummary[]> {
  const { data } = await apiClient.get<CustomerSummary[]>("/Admin/customers");
  return data;
}