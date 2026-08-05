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
