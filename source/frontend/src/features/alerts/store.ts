import { create } from "zustand";
import type { AlertItemType } from "./types";
import { getAlerts, createAlert, updateAlert, deleteAlert, getAlertsStats } from "./api";

interface AlertsState {
  items: AlertItemType[];
  stats: any | null;
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  fetchStats: () => Promise<void>;
  addItem: (data: AlertItemType) => Promise<void>;
  updateItem: (id: number, data: Partial<AlertItemType>) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
}

export const useAlertsStore = create<AlertsState>((set) => ({
  items: [],
  stats: null,
  loading: false,
  error: null,
  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getAlerts();
      set({ items: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  fetchStats: async () => {
    try {
      const data = await getAlertsStats();
      set({ stats: data });
    } catch (error: any) {
      console.error(error);
    }
  },
  addItem: async (data) => {
    try {
      const newItem = await createAlert(data);
      set((state) => ({ items: [...state.items, newItem] }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  updateItem: async (id, data) => {
    try {
      const updatedItem = await updateAlert(id, data);
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? updatedItem : item)),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  removeItem: async (id) => {
    try {
      await deleteAlert(id);
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
