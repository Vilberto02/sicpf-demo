import { apiClient } from "@/lib/apiClient";
import type { MetodoPagoType } from "./types";

export const DEFAULT_METODOS_PAGO: MetodoPagoType[] = [
  { id: 1, nombre: "Efectivo", descripcion: "Pago en efectivo" },
  { id: 2, nombre: "Yape", descripcion: "Billetera digital Yape" },
  { id: 3, nombre: "Plin", descripcion: "Billetera digital Plin" },
  { id: 4, nombre: "Tarjeta", descripcion: "Tarjeta de débito o crédito" },
  { id: 5, nombre: "Transferencia", descripcion: "Transferencia bancaria" },
];

export async function getMetodosPago(): Promise<MetodoPagoType[]> {
  try {
    const data = await apiClient<MetodoPagoType[] | { results: MetodoPagoType[] }>("/metodos-pago/");
    let items: MetodoPagoType[] = [];
    if (Array.isArray(data)) {
      items = data;
    } else if (data && Array.isArray(data.results)) {
      items = data.results;
    }
    return items.length > 0 ? items : DEFAULT_METODOS_PAGO;
  } catch (error) {
    console.error("Error al obtener métodos de pago:", error);
    return DEFAULT_METODOS_PAGO;
  }
}
