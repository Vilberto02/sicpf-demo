import { create } from "zustand";
import type { InventoryItemType } from "./types";
import type { InventoryStatsType, InventoryCategoriesType } from "@/features/shared/statsTypes";
import { getErrorMessage } from "@/features/shared/errorUtils";
import {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  getInventoryStats,
  getInventoryCategories,
} from "./api";

interface InventoryState {
  items: InventoryItemType[];
  count: number;
  page: number;
  pageSize: number;
  search: string;
  ordering: string;
  stats: InventoryStatsType | null;
  categories: InventoryCategoriesType | null;
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setOrdering: (ordering: string) => void;
  setPageSize: (size: number) => void;
  status: string | null;
  setStatus: (status: string | null) => void;
  addItem: (data: Partial<InventoryItemType>) => Promise<void>;
  updateItem: (id: number, data: Partial<InventoryItemType>) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  items: [],
  count: 0,
  page: 1,
  pageSize: 20,
  search: "",
  ordering: "-created_at",
  status: null,
  setStatus: (status) => {
    set({ status, page: 1 });
    get().fetchItems();
  },
  stats: null,
  categories: null,
  loading: false,
  error: null,
  fetchItems: async () => {
    const { page, pageSize, search, ordering, status } = get();
    set({ loading: true, error: null });
    try {
      const data = await getInventory({ page, page_size: pageSize, search, ordering, producto__categoria__nombre: status || undefined });
      set({ items: data.results, count: data.count, loading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
    }
  },
  fetchStats: async () => {
    try {
      const data = await getInventoryStats();
      set({ stats: data });
    } catch (error) {
      console.error(getErrorMessage(error));
    }
  },
  fetchCategories: async () => {
    try {
      const data = await getInventoryCategories();
      set({ categories: data });
    } catch (error) {
      console.error(getErrorMessage(error));
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
  setPageSize: (pageSize) => {
    set({ pageSize, page: 1 });
    get().fetchItems();
  },
  addItem: async (data: Partial<InventoryItemType>) => {
    try {
      await createInventoryItem(data);
      get().fetchItems();
      get().fetchStats();
    } catch (error) {
      set({ error: getErrorMessage(error) });
      throw error;
    }
  },
  updateItem: async (id, data) => {
    try {
      await updateInventoryItem(id, data);
      get().fetchItems();
      get().fetchStats();
    } catch (error) {
      set({ error: getErrorMessage(error) });
      throw error;
    }
  },
  removeItem: async (id) => {
    try {
      await deleteInventoryItem(id);
      get().fetchItems();
      get().fetchStats();
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },
}));
