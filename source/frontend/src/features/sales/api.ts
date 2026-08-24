import { apiClient } from "@/lib/apiClient";
import type { SaleItemType } from "./types";

export const getSalesStats = () => apiClient<any>("/sales/stats/");

export const getMySalesStats = () => apiClient<any>("/sales/stats/mine/");

export const getSales = () => apiClient<SaleItemType[]>("/ventas/");
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
