import { apiClient } from "@/lib/apiClient";
import type { RecommendationItemType } from "./types";

export const getRecommendations = () =>
  apiClient<RecommendationItemType[]>("/recommendations/");
export const createRecommendation = (data: RecommendationItemType) =>
  apiClient<RecommendationItemType>("/recommendations/create/", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateRecommendation = (
  id: number,
  data: Partial<RecommendationItemType>,
) =>
  apiClient<RecommendationItemType>(`/recommendations/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteRecommendation = (id: number) =>
  apiClient<void>(`/recommendations/${id}/delete/`, { method: "DELETE" });
