import { create } from "zustand";
import type { ClienteType } from "./types";
import { getClients, createClient } from "./api";

interface ClientState {
  clients: ClienteType[];
  loading: boolean;
  error: string | null;
  fetchClients: () => Promise<void>;
  addClient: (data: Partial<ClienteType>) => Promise<ClienteType | null>;
}

export const useClientStore = create<ClientState>((set) => ({
  clients: [],
  loading: false,
  error: null,
  fetchClients: async () => {
    set({ loading: true, error: null });
    try {
      const data = await getClients();
      set({ clients: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },
  addClient: async (data) => {
    try {
      const newClient = await createClient(data);
      set((state) => ({ clients: [...state.clients, newClient] }));
      return newClient;
    } catch (error: any) {
      set({ error: error.message });
      return null;
    }
  },
}));
