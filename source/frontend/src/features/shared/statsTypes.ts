export type AlertsStatsType = {
  total_pendientes: number;
  quiebres_estimados: number;
  critical_stock: number;
  at_risk: number;
  generadas_hoy: number;
};

export type InventoryStatsType = {
  total_lotes: number;
  inventory_value: number;
  low_stock: number;
  expiring_soon: number;
};

export type InventoryCategoriesType = {
  labels: string[];
  values: number[];
};

export type SalesStatsType = {
  total_orders: number;
  pending_orders: number;
  completed_orders: number;
  total_revenue: number;
};

export type ProductStatsType = {
  total: number;
  activos: number;
  por_vencer: number;
  vencidos: number;
};

export type MySalesStatsType = {
  total_orders: number;
  completed_orders: number;
  month_orders: number;
  month_revenue: number;
  recent_sales: {
    id?: number;
    cliente_nombre?: string;
    codigo?: string;
    fecha?: string;
    estado?: string;
    total?: string | number;
  }[];
};

export type DashboardChartType = {
  labels: string[];
  dataset01: number[];
  dataset02: number[];
};