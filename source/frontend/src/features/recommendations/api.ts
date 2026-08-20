import { apiClient } from "@/lib/apiClient";
import type { RecommendationItemType } from "./types";

export const getRecommendations = () =>
  apiClient<RecommendationItemType[]>("/recomendaciones/");
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
