import { create } from "zustand";
import type { SaleItemType } from "./types";
import { getSales, createSale, updateSale, deleteSale, getSalesStats } from "./api";

interface SalesState {
  items: SaleItemType[];
  stats: any | null;
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  fetchStats: () => Promise<void>;
  addItem: (data: SaleItemType) => Promise<void>;
  updateItem: (id: number, data: Partial<SaleItemType>) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
}

export const useSalesStore = create<SalesState>((set) => ({
  items: [],
  stats: null,
  loading: false,
  error: null,
  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getSales();
      set({ items: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  fetchStats: async () => {
    try {
      const data = await getSalesStats();
      set({ stats: data });
    } catch (error: any) {
      console.error(error);
    }
  },
  addItem: async (data) => {
    try {
      const newItem = await createSale(data);
      set((state) => ({ items: [...state.items, newItem] }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  updateItem: async (id, data) => {
    try {
      const updatedItem = await updateSale(id, data);
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? updatedItem : item)),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  removeItem: async (id) => {
    try {
      await deleteSale(id);
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
