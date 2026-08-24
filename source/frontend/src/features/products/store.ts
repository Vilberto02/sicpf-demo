import { create } from "zustand";
import type { ProductoType } from "./types";
import {
  getProducts,
  createProduct,
  updateProduct as updateProductApi,
  deleteProduct as deleteProductApi,
  getProductStats,
} from "./api";

type ProductStats = {
  total: number;
  activos: number;
  por_vencer: number;
  vencidos: number;
};

interface ProductState {
  products: ProductoType[];
  stats: ProductStats | null;
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  fetchStats: () => Promise<void>;
  addProduct: (data: Partial<ProductoType>) => Promise<ProductoType | null>;
  updateProduct: (
    id: number,
    data: Partial<ProductoType>
  ) => Promise<ProductoType | null>;
  removeProduct: (id: number) => Promise<boolean>;
}

export const useProductStore = create<ProductState>((set) => ({
  products: [],
  stats: null,
  loading: false,
  error: null,
  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getProducts();
      set({ products: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  fetchStats: async () => {
    try {
      const data = await getProductStats();
      set({ stats: data });
    } catch (error: any) {
      console.error(error);
    }
  },
  addProduct: async (data) => {
    try {
      const newProduct = await createProduct(data);
      set((state) => ({ products: [...state.products, newProduct] }));
      return newProduct;
    } catch (error: any) {
      set({ error: error.message });
      return null;
    }
  },
  updateProduct: async (id, data) => {
    try {
      const updated = await updateProductApi(id, data);
      set((state) => ({
        products: state.products.map((p) => (p.id === id ? updated : p)),
      }));
      return updated;
    } catch (error: any) {
      set({ error: error.message });
      return null;
    }
  },
  removeProduct: async (id) => {
    try {
      await deleteProductApi(id);
      set((state) => ({
        products: state.products.filter((p) => p.id !== id),
      }));
      return true;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },
}));
