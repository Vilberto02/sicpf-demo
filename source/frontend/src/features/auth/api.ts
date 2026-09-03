import { apiClient } from "@/lib/apiClient";
import type { LoginFields } from "@/types";
import type { AuthResponse, UserProfileType } from "./types";

export const login = async (credentials: LoginFields): Promise<AuthResponse> => {
  return apiClient<AuthResponse>("/auth/token/", {
    method: "POST",
    body: JSON.stringify(credentials),
  });
};

export const getProfile = (): Promise<UserProfileType> =>
  apiClient<UserProfileType>("/auth/profile/");

export const updateProfile = (data: Record<string, unknown>): Promise<UserProfileType> =>
  apiClient<UserProfileType>("/auth/profile/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });

export const changePassword = (data: { current_password: string; new_password: string }) =>
  apiClient<{ detail: string; logout_required?: boolean }>("/auth/change-password/", {
    method: "POST",
    body: JSON.stringify(data),
  });