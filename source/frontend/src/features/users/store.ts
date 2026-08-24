import { create } from "zustand";
import type { RolItemType, UsuarioItemType } from "./types";
import {
  getUsers,
  getRoles,
  getSedes,
  createUser,
  updateUser,
  deleteUser,
  setUserActive,
} from "./api";

type SedeItemType = { id: number; nombre: string; direccion?: string | null };

interface UsersState {
  items: UsuarioItemType[];
  roles: RolItemType[];
  sedes: SedeItemType[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  fetchSedes: () => Promise<void>;
  addItem: (data: Partial<UsuarioItemType>) => Promise<UsuarioItemType | null>;
  updateItem: (id: number, data: Partial<UsuarioItemType>) => Promise<UsuarioItemType | null>;
  removeItem: (id: number) => Promise<boolean>;
  toggleActive: (id: number, is_active: boolean) => Promise<void>;
}

export const useUsersStore = create<UsersState>((set) => ({
  items: [],
  roles: [],
  sedes: [],
  loading: false,
  error: null,
  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getUsers();
      set({ items: data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Error inesperado", loading: false });
    }
  },
  fetchRoles: async () => {
    try {
      const data = await getRoles();
      set({ roles: data });
    } catch (error) {
      console.error(error);
    }
  },
  fetchSedes: async () => {
    try {
      const data = await getSedes();
      set({ sedes: data });
    } catch (error) {
      console.error(error);
    }
  },
  addItem: async (data) => {
    try {
      const newItem = await createUser(data);
      set((state) => ({ items: [...state.items, newItem] }));
      return newItem;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Error inesperado" });
      return null;
    }
  },
  updateItem: async (id, data) => {
    try {
      const updated = await updateUser(id, data);
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? updated : item)),
      }));
      return updated;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Error inesperado" });
      return null;
    }
  },
  removeItem: async (id) => {
    try {
      await deleteUser(id);
      set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Error inesperado" });
      return false;
    }
  },
  toggleActive: async (id, is_active) => {
    try {
      const updated = await setUserActive(id, is_active);
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? updated : item)),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Error inesperado" });
    }
  },
}));
