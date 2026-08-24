import { create } from "zustand";
import { login, getProfile, updateProfile, changePassword } from "./api";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  error: string | null;
  userProfile: any | null;
  loginUser: (credentials: any) => Promise<void>;
  logoutUser: () => void;
  fetchProfile: () => Promise<void>;
  editProfile: (data: Record<string, unknown>) => Promise<boolean>;
  changeOwnPassword: (
    data: { current_password: string; new_password: string }
  ) => Promise<{ ok: boolean; logoutRequired?: boolean }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),
  isCheckingAuth: !!localStorage.getItem("token"),
  error: null,
  userProfile: null,
  loginUser: async (credentials) => {
    set({ error: null });
    try {
      const data = await login(credentials);
      localStorage.setItem("token", data.access);
      set({ token: data.access, isAuthenticated: true });
    } catch (error: any) {
      let errorMessage = error.message;
      if (errorMessage === "No active account found with the given credentials") {
        errorMessage = "Las credenciales proporcionadas son incorrectas.";
      }
      set({ error: errorMessage, isAuthenticated: false });
    }
  },
  logoutUser: () => {
    localStorage.removeItem("token");
    set({ token: null, isAuthenticated: false, userProfile: null });
  },
  fetchProfile: async () => {
    set({ isCheckingAuth: true });
    try {
      const data = await getProfile();
      set({ userProfile: data, isAuthenticated: true, isCheckingAuth: false });
    } catch (error: any) {
      console.error("Error fetching profile", error);
      localStorage.removeItem("token");
      set({ token: null, isAuthenticated: false, userProfile: null, isCheckingAuth: false });
    }
  },
  editProfile: async (data) => {
    try {
      const updated = await updateProfile(data);
      set({ userProfile: updated });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  },
  changeOwnPassword: async (data) => {
    const result = await changePassword(data);
    return { ok: true, logoutRequired: result.logout_required };
  }
}));
