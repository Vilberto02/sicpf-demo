import type { LucideIcon } from "lucide-react";

export type LoginFields = {
  username: string;
  password: string;
}

export type SideBarItemType = {
  id: string;
  name: string;
  Icon: LucideIcon;
}

export interface DoughnutChartProps {
  labels: string[];
  values: number[];
  colors: string[];
}

export type BarChartProps = {
  dataset01: number[];
  dataset02: number[];
  label: string[];
};

export type LoteType = {
  id: number;
  producto: number;
  producto_nombre: string;
  producto_codigo: string;
  producto_estado: string;
  categoria_nombre: string;
  codigo_lote: string;
  fecha_vencimiento: string;
  stock_real: number;
  stock_flotante: number;
};

export type VentaType = {
  id: number;
  codigo: string;
  cliente: number;
  cliente_nombre: string;
  total: number;
  fecha: string;
  estado: string;
  vendedor_nombre: string;
};

export type AlertaType = {
  id: number;
  producto_nombre: string;
  alerta: string;
  nivel_riesgo: string;
  periodo_agotamiento: number;
  stock_minimo: number;
  fecha_alerta: string;
  tendencia_consumo?: string;
  categoria_nombre?: string;
}