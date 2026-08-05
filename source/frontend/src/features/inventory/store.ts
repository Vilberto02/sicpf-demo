import { create } from "zustand";
import type { InventoryItemType } from "./types";
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
  stats: any | null;
  categories: any | null;
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  addItem: (data: InventoryItemType) => Promise<void>;
  updateItem: (id: number, data: Partial<InventoryItemType>) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
}

export const useInventoryStore = create<InventoryState>((set) => ({
  items: [],
  stats: null,
  categories: null,
  loading: false,
  error: null,
  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getInventory();
      set({ items: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  fetchStats: async () => {
    try {
      const data = await getInventoryStats();
      set({ stats: data });
    } catch (error: any) {
      console.error(error);
    }
  },
  fetchCategories: async () => {
    try {
      const data = await getInventoryCategories();
      set({ categories: data });
    } catch (error: any) {
      console.error(error);
    }
  },
  addItem: async (data) => {
    try {
      const newItem = await createInventoryItem(data);
      set((state) => ({ items: [...state.items, newItem] }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  updateItem: async (id, data) => {
    try {
      const updatedItem = await updateInventoryItem(id, data);
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? updatedItem : item)),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  removeItem: async (id) => {
    try {
      await deleteInventoryItem(id);
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
