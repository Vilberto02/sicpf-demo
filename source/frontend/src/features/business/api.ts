import { apiClient } from "@/lib/apiClient";
import type { NegocioType } from "./types";

export const DEFAULT_NEGOCIO: NegocioType = {
  nombre_comercial: "RAQUEL PERFUMERIA",
  razon_social: "RAQUEL PERFUMERIA S.A.C.",
  ruc: "10157484405",
  direccion: "CALLE ANIMAS NRO. 124",
  distrito: "HUARAL",
  provincia: "HUARAL",
  departamento: "LIMA",
  url_consulta: "facturacion.sicpf.com/consulta",
  mensaje_pie: "¡NO HAY CAMBIOS NI DEVOLUCIONES!\n¡GRACIAS POR SU COMPRA!",
  leyenda_software: "UN SOFTWARE DE SICPF\nWWW.SICPF.COM",
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
