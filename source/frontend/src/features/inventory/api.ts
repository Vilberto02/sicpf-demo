import { apiClient } from "@/lib/apiClient";
import type { InventoryItemType } from "./types";
import type { PaginatedResponse } from "@/types";

export const getInventoryStats = () => apiClient<any>("/inventory/stats/");
export const getInventoryCategories = () => apiClient<any>("/inventory/categories/");

export const getInventory = (params?: Record<string, string | number | boolean | undefined | null>) =>
  apiClient<PaginatedResponse<InventoryItemType>>("/lotes/", { params });
export const getLoteCatalogo = (params?: Record<string, string | number | boolean | undefined | null>) =>
  apiClient<PaginatedResponse<InventoryItemType>>("/lotes/catalogo/", { params });
export const createInventoryItem = (data: Partial<InventoryItemType>) =>
  apiClient<InventoryItemType>("/lotes/create/", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateInventoryItem = (
  id: number,
  data: Partial<InventoryItemType>,
) =>
  apiClient<InventoryItemType>(`/lotes/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteInventoryItem = (id: number) =>
  apiClient<void>(`/lotes/${id}/delete/`, { method: "DELETE" });
