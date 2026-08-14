import { apiClient } from "@/lib/apiClient";
import type { InventoryItemType } from "./types";

export const getInventoryStats = () => apiClient<any>("/inventory/stats/");
export const getInventoryCategories = () => apiClient<any>("/inventory/categories/");

export const getInventory = () => apiClient<InventoryItemType[]>("/lotes/");
export const createInventoryItem = (data: InventoryItemType) =>
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
