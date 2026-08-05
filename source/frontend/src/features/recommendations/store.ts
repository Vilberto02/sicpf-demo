import { create } from "zustand";
import type { RecommendationItemType } from "./types";
import {
  getRecommendations,
  createRecommendation,
  updateRecommendation,
  deleteRecommendation,
} from "./api";

interface RecommendationsState {
  items: RecommendationItemType[];
  loading: boolean;
  error: string | null;
  fetchItems: () => Promise<void>;
  addItem: (data: RecommendationItemType) => Promise<void>;
  updateItem: (
    id: number,
    data: Partial<RecommendationItemType>,
  ) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
}

export const useRecommendationsStore = create<RecommendationsState>((set) => ({
  items: [],
  loading: false,
  error: null,
  fetchItems: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getRecommendations();
      set({ items: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  addItem: async (data) => {
    try {
      const newItem = await createRecommendation(data);
      set((state) => ({ items: [...state.items, newItem] }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  updateItem: async (id, data) => {
    try {
      const updatedItem = await updateRecommendation(id, data);
      set((state) => ({
        items: state.items.map((item) => (item.id === id ? updatedItem : item)),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },
  removeItem: async (id) => {
    try {
      await deleteRecommendation(id);
      set((state) => ({
        items: state.items.filter((item) => item.id !== id),
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
