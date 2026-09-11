import type { LucideIcon } from "lucide-react";

export type LoginFields = {
  username: string;
  password: string;
}

export type SideBarItemType = {
  id: string;
  name: string;
  Icon: LucideIcon;
  children?: SideBarSubItemType[];
}

export type SideBarSubItemType = {
  id: string;
  name: string;
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

export type MarcaType = {
  id: number;
  nombre: string;
  descripcion?: string | null;
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
  presentacion_nombre: string;
  presentacion_abrev: string;
  estado: string;
  tipo_producto?: "marca" | "generico";
  tipo_producto_display?: string;
  marca?: number | null;
  marca_nombre?: string | null;
  producto_dci?: string | null;
  producto_concentracion?: string | null;
  producto_forma_farmaceutica?: string | null;
  producto_registro_sanitario?: string | null;
  producto_condicion_venta?: "libre" | "receta" | "receta_retenida";
  producto_condicion_venta_display?: string;
  created_at?: string;
};

export type VentaDetalleType = {
  id?: number;
  producto?: number;
  producto_nombre?: string;
  lote?: number;
  lote_codigo?: string;
  lote_fecha_vencimiento?: string;
  cantidad_real: number;
  cantidad_blister: number;
  cantidad_flotante: number;
  precio_real: number;
  precio_blister: number;
  precio_flotante: number;
};

export type VentaType = {
  id?: number;
  codigo: string;
  tipo_comprobante?: string;
  tipo_comprobante_display?: string;
  cliente: number;
  cliente_nombre?: string;
  cliente_dni?: string | null;
  usuario?: number;
  total: number;
  op_gravada?: number;
  igv?: number;
  subtotal?: number;
  fecha: string;
  estado: string;
  vendedor_nombre?: string;
  detalles?: VentaDetalleType[];
  detalles_write?: any[];
};

export type LoteAfectadoType = {
  id: number;
  codigo_lote: string;
  fecha_vencimiento: string;
  dias_restantes: number;
  vencido: boolean;
  stock_real: number;
  stock_flotante: number;
};

export type AlertaType = {
  id: number;
  producto_nombre: string;
  producto_codigo?: string;
  alerta: string;
  tipo?: 'stock_critico' | 'stock_bajo' | 'vencimiento' | 'quiebre' | null;
  nivel_riesgo: string;
  periodo_agotamiento: number;
  stock_minimo: number;
  stock_minimo_flotante?: number | null;
  fecha_alerta: string;
  tendencia_consumo?: string;
  categoria_nombre?: string;
  estado: 'pendiente' | 'revisada' | 'descartada';
  origen: 'reglas' | 'ml' | 'manual';
  created_at: string;
  updated_at: string;
  // Contexto calculado por el backend para el detalle
  producto_stock_minimo_real?: number;
  producto_stock_minimo_flotante?: number;
  stock_actual_real?: number;
  stock_actual_flotante?: number;
  total_unidades?: number;
  ventas_promedio_diario_30d?: number;
  dias_cobertura?: number;
  explicacion?: string;
  lotes_afectados?: LoteAfectadoType[];
}