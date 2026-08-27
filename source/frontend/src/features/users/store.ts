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
  count: number;
  page: number;
  pageSize: number;
  search: string;
  ordering: string;
  roles: RolItemType[];
  sedes: SedeItemType[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  fetchRoles: () => Promise<void>;
  fetchSedes: () => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setOrdering: (ordering: string) => void;
  addItem: (data: Partial<UsuarioItemType>) => Promise<UsuarioItemType | null>;
  updateItem: (id: number, data: Partial<UsuarioItemType>) => Promise<UsuarioItemType | null>;
  removeItem: (id: number) => Promise<boolean>;
  toggleActive: (id: number, is_active: boolean) => Promise<void>;
}

export const useUsersStore = create<UsersState>((set, get) => ({
  items: [],
  count: 0,
  page: 1,
  pageSize: 20,
  search: "",
  ordering: "user__first_name",
  roles: [],
  sedes: [],
  loading: false,
  error: null,
  fetchItems: async () => {
    const { page, pageSize, search, ordering } = get();
    set({ loading: true, error: null });
    try {
      const data = await getUsers({ page, page_size: pageSize, search, ordering });
      set({ items: data.results, count: data.count, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Error inesperado", loading: false });
    }
  },
  fetchRoles: async () => {
    try {
      const data = await getRoles();
      set({ roles: Array.isArray(data) ? data : data.results ?? [] });
    } catch (error) {
      console.error(error);
    }
  },
  fetchSedes: async () => {
    try {
      const data = await getSedes();
      set({ sedes: Array.isArray(data) ? data : data.results ?? [] });
    } catch (error) {
      console.error(error);
    }
  },
  setPage: (page) => {
    set({ page });
    get().fetchItems();
  },
  setSearch: (search) => {
    set({ search, page: 1 });
    get().fetchItems();
  },
  setOrdering: (ordering) => {
    set({ ordering, page: 1 });
    get().fetchItems();
  },
  addItem: async (data) => {
    try {
      const newItem = await createUser(data);
      get().fetchItems();
      return newItem;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Error inesperado" });
      return null;
    }
  },
  updateItem: async (id, data) => {
    try {
      const updated = await updateUser(id, data);
      get().fetchItems();
      return updated;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Error inesperado" });
      return null;
    }
  },
  removeItem: async (id) => {
    try {
      await deleteUser(id);
      get().fetchItems();
      return true;
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Error inesperado" });
      return false;
    }
  },
  toggleActive: async (id, is_active) => {
    try {
      await setUserActive(id, is_active);
      get().fetchItems();
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Error inesperado" });
    }
  },
}));
