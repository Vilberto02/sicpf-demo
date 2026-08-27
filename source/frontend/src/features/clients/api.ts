import { apiClient } from "@/lib/apiClient";
import type { ClienteType } from "./types";
import type { PaginatedResponse } from "@/types";

export const getClients = (params?: Record<string, string | number | boolean | undefined | null>) =>
  apiClient<PaginatedResponse<ClienteType>>("/clientes/", { params });
export const createClient = (data: Partial<ClienteType>) =>
  apiClient<ClienteType>("/clientes/create/", {
    method: "POST",
    body: JSON.stringify(data),
  });
