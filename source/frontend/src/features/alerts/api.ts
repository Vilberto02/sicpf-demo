import { apiClient } from "@/lib/apiClient";
import type { AlertItemType } from "./types";

export const getAlertsStats = () => apiClient<any>("/alerts/stats/");

export const getAlerts = () => apiClient<AlertItemType[]>("/alertas/");
export const createAlert = (data: AlertItemType) =>
  apiClient<AlertItemType>("/alertas/create/", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateAlert = (id: number, data: Partial<AlertItemType>) =>
  apiClient<AlertItemType>(`/alertas/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteAlert = (id: number) =>
  apiClient<void>(`/alertas/${id}/delete/`, { method: "DELETE" });
