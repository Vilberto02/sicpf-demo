import { create } from "zustand";
import type { AlertItemType } from "./types";
import {
  getAlerts,
  createAlert,
  updateAlert,
  deleteAlert,
  getAlertsStats,
  generateAlerts,
  markAlertReviewed,
  markAlertDiscarded,
} from "./api";

interface AlertsState {
  items: AlertItemType[];
  count: number;
  page: number;
  pageSize: number;
  search: string;
  ordering: string;
  stats: any | null;
  loading: boolean;
  error: string | null;
  generating: boolean;
  fetchItems: () => Promise<void>;
  fetchStats: () => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setOrdering: (ordering: string) => void;
  setPageSize: (size: number) => void;
  status: string | null;
  setStatus: (status: string | null) => void;
  addItem: (data: AlertItemType) => Promise<void>;
  updateItem: (id: number, data: Partial<AlertItemType>) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  generateAlerts: () => Promise<{ generadas: number }>;
  markReviewed: (id: number) => Promise<void>;
  markDiscarded: (id: number) => Promise<void>;
}

export const useAlertsStore = create<AlertsState>((set, get) => ({
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
  loading: false,
  error: null,
  generating: false,
  fetchItems: async () => {
    const { page, pageSize, search, ordering, status } = get();
    set({ loading: true, error: null });
    try {
      const data = await getAlerts({ page, page_size: pageSize, search, ordering, nivel_riesgo: status?.toLowerCase() || undefined });
      set({ items: data.results, count: data.count, loading: false });
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
  addItem: async (data) => {
    try {
      await createAlert(data);
      get().fetchItems();
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  updateItem: async (id, data) => {
    try {
      await updateAlert(id, data);
      get().fetchItems();
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  removeItem: async (id) => {
    try {
      await deleteAlert(id);
      get().fetchItems();
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  generateAlerts: async () => {
    set({ generating: true, error: null });
    try {
      const result = await generateAlerts();
      await useAlertsStore.getState().fetchItems();
      await useAlertsStore.getState().fetchStats();
      set({ generating: false });
      return { generadas: result.generadas };
    } catch (error: any) {
      set({ error: error.message, generating: false });
      throw error;
    }
  },
  markReviewed: async (id) => {
    try {
      await markAlertReviewed(id);
      get().fetchItems();
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  markDiscarded: async (id) => {
    try {
      await markAlertDiscarded(id);
      get().fetchItems();
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
