import { apiClient } from "@/lib/apiClient";
import type { LoginFields } from "@/types";

export const login = async (credentials: LoginFields) => {
  const data = await apiClient<any>("/auth/token/", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
  return data;
};

export const getProfile = () => apiClient<any>("/auth/profile/");

export const updateProfile = (data: Record<string, unknown>) =>
  apiClient<any>("/auth/profile/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const changePassword = (data: { current_password: string; new_password: string }) =>
  apiClient<{ detail: string; logout_required?: boolean }>("/auth/change-password/", {
    method: "POST",
    body: JSON.stringify(data),
  });
