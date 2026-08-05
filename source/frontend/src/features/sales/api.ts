import { apiClient } from "@/lib/apiClient";
import type { SaleItemType } from "./types";

export const getSalesStats = () => apiClient<any>("/sales/stats/");

export const getSales = () => apiClient<SaleItemType[]>("/sales/");
export const createSale = (data: SaleItemType) =>
  apiClient<SaleItemType>("/sales/create/", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateSale = (id: number, data: Partial<SaleItemType>) =>
  apiClient<SaleItemType>(`/sales/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteSale = (id: number) =>
  apiClient<void>(`/sales/${id}/delete/`, { method: "DELETE" });
