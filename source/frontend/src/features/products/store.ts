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
  count: number;
  page: number;
  pageSize: number;
  search: string;
  ordering: string;
  stats: ProductStats | null;
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  fetchStats: () => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setOrdering: (ordering: string) => void;
  setPageSize: (size: number) => void;
  category: string | null;
  setCategory: (category: string | null) => void;
  addProduct: (data: Partial<ProductoType>) => Promise<ProductoType | null>;
  updateProduct: (
    id: number,
    data: Partial<ProductoType>
  ) => Promise<ProductoType | null>;
  removeProduct: (id: number) => Promise<boolean>;
}

export const useProductStore = create<ProductState>((set, get) => ({
  products: [],
  count: 0,
  page: 1,
  pageSize: 20,
  search: "",
  ordering: "-created_at",
  category: null,
  setCategory: (category) => {
    set({ category, page: 1 });
    get().fetchProducts();
  },
  stats: null,
  loading: false,
  error: null,
  fetchProducts: async () => {
    const { page, pageSize, search, ordering, category } = get();
    set({ loading: true, error: null });
    try {
      const data = await getProducts({ page, page_size: pageSize, search, ordering, categoria__nombre: category || undefined });
      set({ products: data.results, count: data.count, loading: false });
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
  setPage: (page) => {
    set({ page });
    get().fetchProducts();
  },
  setSearch: (search) => {
    set({ search, page: 1 });
    get().fetchProducts();
  },
  setOrdering: (ordering) => {
    set({ ordering, page: 1 });
    get().fetchProducts();
  },
  setPageSize: (pageSize) => {
    set({ pageSize, page: 1 });
    get().fetchProducts();
  },
  addProduct: async (data) => {
    try {
      const newProduct = await createProduct(data);
      get().fetchProducts();
      get().fetchStats();
      return newProduct;
    } catch (error: any) {
      set({ error: error.message });
      return null;
    }
  },
  updateProduct: async (id, data) => {
    try {
      const updated = await updateProductApi(id, data);
      get().fetchProducts();
      get().fetchStats();
      return updated;
    } catch (error: any) {
      set({ error: error.message });
      return null;
    }
  },
  removeProduct: async (id) => {
    try {
      await deleteProductApi(id);
      get().fetchProducts();
      get().fetchStats();
      return true;
    } catch (error: any) {
      set({ error: error.message });
      return false;
    }
  },
}));
