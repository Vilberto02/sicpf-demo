import { create } from "zustand";
import type { RecommendationItemType } from "./types";
import { getErrorMessage } from "@/features/shared/errorUtils";
import {
  getRecommendations,
  createRecommendation,
  updateRecommendation,
  deleteRecommendation,
} from "./api";

interface RecommendationsState {
  items: RecommendationItemType[];
  count: number;
  page: number;
  pageSize: number;
  search: string;
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  addItem: (data: RecommendationItemType) => Promise<void>;
  updateItem: (id: number, data: Partial<RecommendationItemType>) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
}

export const useRecommendationsStore = create<RecommendationsState>((set, get) => ({
  items: [],
  count: 0,
  page: 1,
  pageSize: 20,
  search: "",
  loading: false,
  error: null,
  fetchItems: async () => {
    const { page, pageSize, search } = get();
    set({ loading: true, error: null });
    try {
      const data = await getRecommendations({ page, page_size: pageSize, search });
      set({ items: data.results, count: data.count, loading: false });
    } catch (error) {
      set({ error: getErrorMessage(error), loading: false });
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
  addItem: async (data) => {
    try {
      await createRecommendation(data);
      get().fetchItems();
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },
  updateItem: async (id, data) => {
    try {
      await updateRecommendation(id, data);
      get().fetchItems();
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },
  removeItem: async (id) => {
    try {
      await deleteRecommendation(id);
      get().fetchItems();
    } catch (error) {
      set({ error: getErrorMessage(error) });
    }
  },
}));
