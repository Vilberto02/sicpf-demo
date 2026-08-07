import { create } from "zustand";
import { login, getProfile } from "./api";

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  error: string | null;
  userProfile: any | null;
  loginUser: (credentials: any) => Promise<void>;
  logoutUser: () => void;
  fetchProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem("token"),
  isAuthenticated: !!localStorage.getItem("token"),
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
    try {
      const data = await getProfile();
      set({ userProfile: data });
    } catch (error: any) {
      console.error("Error fetching profile", error);
    }
  }
}));
