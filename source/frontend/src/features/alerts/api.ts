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

export const generateAlerts = () =>
  apiClient<{ generadas: number; alertas: AlertItemType[] }>(
    "/alerts/generate/",
    { method: "POST" }
  );

export const getAlertsPending = () =>
  apiClient<AlertItemType[]>("/alerts/pending/");

export const markAlertReviewed = (id: number) =>
  apiClient<AlertItemType>(`/alertas/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify({ estado: "revisada" }),
  });

export const markAlertDiscarded = (id: number) =>
  apiClient<AlertItemType>(`/alertas/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify({ estado: "descartada" }),
  });
