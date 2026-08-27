import { create } from "zustand";
import type { SaleItemType } from "./types";
import {
  getSales,
  createSale,
  updateSale,
  deleteSale,
  getSalesStats,
  getMySalesStats,
} from "./api";

interface SalesState {
  items: SaleItemType[];
  count: number;
  page: number;
  pageSize: number;
  search: string;
  ordering: string;
  stats: any | null;
  myStats: any | null;
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  fetchStats: () => Promise<void>;
  fetchMyStats: () => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setOrdering: (ordering: string) => void;
  setPageSize: (size: number) => void;
  usuarioId: string | null;
  setUsuarioId: (id: string | null) => void;
  status: string | null;
  setStatus: (status: string | null) => void;
  addItem: (data: SaleItemType) => Promise<void>;
  updateItem: (id: number, data: Partial<SaleItemType>) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
}

export const useSalesStore = create<SalesState>((set, get) => ({
  items: [],
  count: 0,
  page: 1,
  pageSize: 20,
  search: "",
  ordering: "-fecha",
  stats: null,
  myStats: null,
  loading: false,
  error: null,
  usuarioId: null,
  setUsuarioId: (id) => {
    set({ usuarioId: id, page: 1 });
    get().fetchItems();
  },
  status: null,
  setStatus: (status) => {
    set({ status, page: 1 });
    get().fetchItems();
  },
  fetchItems: async () => {
    const { page, pageSize, search, ordering, usuarioId, status } = get();
    set({ loading: true, error: null });
    try {
      const data = await getSales({ page, page_size: pageSize, search, ordering, usuario: usuarioId || undefined, estado: status || undefined });
      set({ items: data.results, count: data.count, loading: false });
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
  fetchMyStats: async () => {
    try {
      const data = await getMySalesStats();
      set({ myStats: data });
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
  setPageSize: (pageSize) => {
    set({ pageSize, page: 1 });
    get().fetchItems();
  },
  addItem: async (data) => {
    try {
      await createSale(data);
      get().fetchItems();
      get().fetchStats();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
  updateItem: async (id, data) => {
    try {
      await updateSale(id, data);
      get().fetchItems();
      get().fetchStats();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
  removeItem: async (id) => {
    try {
      await deleteSale(id);
      get().fetchItems();
      get().fetchStats();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    }
  },
}));
