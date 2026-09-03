import { apiClient } from "@/lib/apiClient";
import type { SaleItemType } from "./types";
import type { PaginatedResponse } from "@/types";
import type { SalesStatsType, MySalesStatsType } from "@/features/shared/statsTypes";

export const getSalesStats = () => apiClient<SalesStatsType>("/sales/stats/");

export const getMySalesStats = () => apiClient<MySalesStatsType>("/sales/stats/mine/");

export const getSales = (params?: Record<string, string | number | boolean | undefined | null>) =>
  apiClient<PaginatedResponse<SaleItemType>>("/ventas/", { params });
export const createSale = (data: SaleItemType) =>
  apiClient<SaleItemType>("/ventas/create/", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateSale = (id: number, data: Partial<SaleItemType>) =>
  apiClient<SaleItemType>(`/ventas/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteSale = (id: number) =>
  apiClient<void>(`/ventas/${id}/delete/`, { method: "DELETE" });
