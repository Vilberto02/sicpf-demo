import { apiClient } from "@/lib/apiClient";
import type { ClienteType } from "./types";

export const getClients = () => apiClient<ClienteType[]>("/clientes/");
export const createClient = (data: Partial<ClienteType>) =>
  apiClient<ClienteType>("/clientes/create/", {
    method: "POST",
    body: JSON.stringify(data),
  });
