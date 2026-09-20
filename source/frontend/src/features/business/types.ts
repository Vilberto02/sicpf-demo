export interface NegocioType {
  id?: number;
  nombre_comercial: string;
  razon_social: string;
  ruc: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
  telefono?: string | null;
  email?: string | null;
  logo_url?: string | null;
  url_consulta: string;
  mensaje_pie: string;
  leyenda_software: string;
  serie_boleta_defecto: string;
  moneda_nombre: string;
  moneda_simbolo: string;
}
