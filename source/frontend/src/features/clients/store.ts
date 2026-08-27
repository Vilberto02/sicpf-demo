import { create } from "zustand";
import type { ClienteType } from "./types";
import { getClients, createClient } from "./api";

interface ClientState {
  clients: ClienteType[];
  count: number;
  page: number;
  pageSize: number;
  search: string;
  loading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  addClient: (data: Partial<ClienteType>) => Promise<ClienteType | null>;
}

export const useClientStore = create<ClientState>((set, get) => ({
  clients: [],
  count: 0,
  page: 1,
  pageSize: 100,
  search: "",
  loading: false,
  error: null,
  fetchClients: async () => {
    const { page, pageSize, search } = get();
    set({ loading: true, error: null });
    try {
      const data = await getClients({ page, page_size: pageSize, search });
      set({ clients: data.results, count: data.count, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  setPage: (page) => {
    set({ page });
    get().fetchClients();
  },
  setSearch: (search) => {
    set({ search, page: 1 });
    get().fetchClients();
  },
  addClient: async (data) => {
    try {
      const newClient = await createClient(data);
      get().fetchClients();
      return newClient;
    } catch (error: any) {
      set({ error: error.message });
      return null;
    }
  },
}));
