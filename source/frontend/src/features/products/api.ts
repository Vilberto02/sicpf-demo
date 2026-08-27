import { apiClient } from "@/lib/apiClient";
import type {
  ProductoType,
  CategoriaType,
  PresentacionType,
} from "./types";
import type { PaginatedResponse } from "@/types";

export const getProducts = (params?: Record<string, string | number | boolean | undefined | null>) =>
  apiClient<PaginatedResponse<ProductoType>>("/productos/", { params });
export const createProduct = (data: Partial<ProductoType>) =>
  apiClient<ProductoType>("/productos/create/", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateProduct = (id: number, data: Partial<ProductoType>) =>
  apiClient<ProductoType>(`/productos/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
export const deleteProduct = (id: number) =>
  apiClient<void>(`/productos/${id}/delete/`, { method: "DELETE" });
export const getProductStats = () =>
  apiClient<{
    total: number;
    activos: number;
    por_vencer: number;
    vencidos: number;
  }>("/productos/stats/");
export const getCategorias = () => apiClient<PaginatedResponse<CategoriaType>>("/categorias/");
export const getPresentaciones = () =>
  apiClient<PaginatedResponse<PresentacionType>>("/presentaciones/");
