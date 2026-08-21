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
  precio_real: number;
  precio_flotante: number;
  precio_blister: number;
  unidades_por_blister: number;
  unidades_por_caja: number;
  blisters_por_caja: number;
  presentacion_principal: boolean;
  presentacion_blister: boolean;
  presentacion_unidad: boolean;
  unidad_medida_nombre: string;
  unidad_medida_abrev: string;
};

export type VentaType = {
  id?: number;
  codigo: string;
  cliente: number;
  cliente_nombre?: string;
  usuario?: number;
  total: number;
  fecha: string;
  estado: string;
  vendedor_nombre?: string;
  detalles?: any[];
  detalles_write?: any[];
};

export type AlertaType = {
  id: number;
  producto_nombre: string;
  producto_codigo?: string;
  alerta: string;
  nivel_riesgo: string;
  periodo_agotamiento: number;
  stock_minimo: number;
  fecha_alerta: string;
  tendencia_consumo?: string;
  categoria_nombre?: string;
  estado: 'pendiente' | 'revisada' | 'descartada';
  origen: 'reglas' | 'ml' | 'manual';
  created_at: string;
  updated_at: string;
}