import { apiClient } from "@/lib/apiClient";
import type { InventoryItemType } from "./types";

export const getInventoryStats = () => apiClient<any>("/inventory/stats/");
export const getInventoryCategories = () => apiClient<any>("/inventory/categories/");

export const getInventory = () => apiClient<InventoryItemType[]>("/inventory/");
export const createInventoryItem = (data: InventoryItemType) =>
  apiClient<InventoryItemType>("/inventory/create/", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateInventoryItem = (
  id: number,
  data: Partial<InventoryItemType>,
) =>
  apiClient<InventoryItemType>(`/inventory/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteInventoryItem = (id: number) =>
  apiClient<void>(`/inventory/${id}/delete/`, { method: "DELETE" });
