import { apiClient } from "@/lib/apiClient";
import type { NegocioType } from "./types";

export const DEFAULT_NEGOCIO: NegocioType = {
  nombre_comercial: "SICPF",
  razon_social: "",
  ruc: "",
  direccion: "",
  distrito: "",
  provincia: "",
  departamento: "",
  url_consulta: "",
  mensaje_pie: "¡GRACIAS POR SU COMPRA!",
  leyenda_software: "Generado por SICPF",
  serie_boleta_defecto: "B001",
  moneda_nombre: "SOLES",
  moneda_simbolo: "S/",
};

export async function getNegocio(): Promise<NegocioType> {
  try {
    return await apiClient<NegocioType>("/negocio/");
  } catch (err) {
    console.warn("No se pudo cargar la configuración del negocio, usando defaults:", err);
    return DEFAULT_NEGOCIO;
  }
}
