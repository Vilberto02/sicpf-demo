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
import type { AlertsStatsType } from "@/features/shared/statsTypes";
import { getErrorMessage } from "@/features/shared/errorUtils";

interface AlertsState {
  items: AlertItemType[];
  count: number;
  page: number;
  pageSize: number;
  search: string;
  ordering: string;
  estado: string | null;
  nivelRiesgo: string | null;
  stats: AlertsStatsType | null;
  loading: boolean;
  error: string | null;
  generating: boolean;
  fetchItems: () => Promise<void>;
  fetchStats: () => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setOrdering: (ordering: string) => void;
  setPageSize: (size: number) => void;
  setEstado: (estado: string | null) => void;
  setNivelRiesgo: (nivelRiesgo: string | null) => void;
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
  ordering: "",
  estado: null,
  nivelRiesgo: null,
  status: null,
  setStatus: (status) => {
    set({ status, nivelRiesgo: status, page: 1 });
    get().fetchItems();
  },
  setEstado: (estado) => {
    set({ estado, page: 1 });
    get().fetchItems();
  },
  setNivelRiesgo: (nivelRiesgo) => {
    set({ nivelRiesgo, status: nivelRiesgo, page: 1 });
    get().fetchItems();
  },
  stats: null,
  loading: false,
  error: null,
  generating: false,
  fetchItems: async () => {
    const { page, pageSize, search, ordering, estado, nivelRiesgo } = get();
    set({ loading: true, error: null });
    try {
      const params: Record<string, string | number | undefined> = {
        page,
        page_size: pageSize,
      };
      if (search) params.search = search;
      if (ordering) params.ordering = ordering;
      if (estado && estado !== "all" && estado !== "Todos") params.estado = estado.toLowerCase();
      if (nivelRiesgo && nivelRiesgo !== "all" && nivelRiesgo !== "Todos") params.nivel_riesgo = nivelRiesgo.toLowerCase();

      const data = await getAlerts(params);
      set({ items: data.results, count: data.count, loading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
    }
  },
  fetchStats: async () => {
    try {
      const data = await getAlertsStats();
      set({ stats: data });
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
  addItem: async (data) => {
    try {
      await createAlert(data);
      get().fetchItems();
      get().fetchStats();
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },
  updateItem: async (id, data) => {
    try {
      await updateAlert(id, data);
      get().fetchItems();
      get().fetchStats();
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },
  removeItem: async (id) => {
    try {
      await deleteAlert(id);
      get().fetchItems();
      get().fetchStats();
    } catch (error) {
      set({ error: getErrorMessage(error) });
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
    } catch (error) {
      set({ error: getErrorMessage(error), generating: false });
      throw error;
    }
  },
  markReviewed: async (id) => {
    try {
      await markAlertReviewed(id);
      get().fetchItems();
      get().fetchStats();
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },
  markDiscarded: async (id) => {
    try {
      await markAlertDiscarded(id);
      get().fetchItems();
      get().fetchStats();
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },
}));
