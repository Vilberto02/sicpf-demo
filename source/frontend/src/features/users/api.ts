import { apiClient } from "@/lib/apiClient";
import type { RolItemType, UsuarioItemType } from "./types";

export const getUsers = () => apiClient<UsuarioItemType[]>("/usuarios/");
export const getRoles = () => apiClient<RolItemType[]>("/roles/");
export const getSedes = () => apiClient<{ id: number; nombre: string; direccion?: string | null }[]>("/sedes/");

export const createUser = (data: Partial<UsuarioItemType>) =>
  apiClient<UsuarioItemType>("/usuarios/create/", {
    method: "POST",
    body: JSON.stringify(data),
  });

export const updateUser = (id: number, data: Partial<UsuarioItemType>) =>
  apiClient<UsuarioItemType>(`/usuarios/${id}/update/`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const deleteUser = (id: number) =>
  apiClient<void>(`/usuarios/${id}/delete/`, { method: "DELETE" });

export const setUserActive = (id: number, is_active: boolean) =>
  apiClient<UsuarioItemType>(`/usuarios/${id}/active/`, {
    method: "PATCH",
    body: JSON.stringify({ is_active }),
  });
