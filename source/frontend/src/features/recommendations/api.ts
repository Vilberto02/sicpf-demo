import { apiClient } from "@/lib/apiClient";
import type { RecommendationItemType } from "./types";
import type { PaginatedResponse } from "@/types";

export const getRecommendations = (params?: Record<string, string | number | boolean | undefined | null>) =>
  apiClient<PaginatedResponse<RecommendationItemType>>("/recomendaciones/", { params });
export const createRecommendation = (data: RecommendationItemType) =>
  apiClient<RecommendationItemType>("/recomendaciones/create/", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateRecommendation = (
  id: number,
  data: Partial<RecommendationItemType>,
) =>
  apiClient<RecommendationItemType>(`/recomendaciones/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteRecommendation = (id: number) =>
  apiClient<void>(`/recomendaciones/${id}/delete/`, { method: "DELETE" });
