import { apiClient } from "@/lib/apiClient";
import type { AlertItemType } from "./types";

export const getAlertsStats = () => apiClient<any>("/alerts/stats/");

export const getAlerts = () => apiClient<AlertItemType[]>("/alerts/");
export const createAlert = (data: AlertItemType) =>
  apiClient<AlertItemType>("/alerts/create/", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateAlert = (id: number, data: Partial<AlertItemType>) =>
  apiClient<AlertItemType>(`/alerts/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteAlert = (id: number) =>
  apiClient<void>(`/alerts/${id}/delete/`, { method: "DELETE" });
