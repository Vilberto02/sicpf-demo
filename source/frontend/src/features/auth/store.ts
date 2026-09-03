import { create } from "zustand";
import { login, getProfile, updateProfile, changePassword } from "./api";
import { getToken, setTokens, clearToken } from "./token";
import { getErrorMessage } from "@/features/shared/errorUtils";
import type { UserProfileType } from "./types";
import type { LoginInput } from "./schemas";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  error: string | null;
  userProfile: UserProfileType | null;
  loginUser: (credentials: LoginInput) => Promise<void>;
  logoutUser: () => void;
  fetchProfile: () => Promise<void>;
  editProfile: (data: Record<string, unknown>) => Promise<boolean>;
  changeOwnPassword: (
    data: { current_password: string; new_password: string }
  ) => Promise<{ ok: boolean; logoutRequired?: boolean }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: getToken(),
  isAuthenticated: !!getToken(),
  isCheckingAuth: !!getToken(),
  error: null,
  userProfile: null,
  loginUser: async (credentials) => {
    set({ error: null });
    try {
      const data = await login(credentials);
      setTokens(data.access, data.refresh);
      set({ token: data.access, isAuthenticated: true });
    } catch (error) {
      let errorMessage = getErrorMessage(error);
      if (errorMessage === "No active account found with the given credentials") {
        errorMessage = "Las credenciales proporcionadas son incorrectas.";
      }
      set({ error: errorMessage, isAuthenticated: false });
    }
  },
  logoutUser: () => {
    clearToken();
    set({ token: null, isAuthenticated: false, userProfile: null });
  },
  fetchProfile: async () => {
    set({ isCheckingAuth: true });
    try {
      const data = await getProfile();
      set({ userProfile: data, isAuthenticated: true, isCheckingAuth: false });
    } catch (error) {
      console.error("Error fetching profile", getErrorMessage(error));
      clearToken();
      set({ token: null, isAuthenticated: false, userProfile: null, isCheckingAuth: false });
    }
  },
  editProfile: async (data) => {
    try {
      const updated = await updateProfile(data);
      set({ userProfile: updated });
      return true;
    } catch (error) {
      console.error(getErrorMessage(error));
      return false;
    }
  },
  changeOwnPassword: async (data) => {
    try {
      const result = await changePassword(data);
      return { ok: true, logoutRequired: result.logout_required };
    } catch (error) {
      throw error;
    }
  }
}));
