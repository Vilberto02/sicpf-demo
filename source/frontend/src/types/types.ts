import type { LucideIcon } from "lucide-react";

export type LoginFields = {
  email: string;
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

export type InventoryItemType = {
  id: string;
  codigo: string;
  nombre: string;
  stockFlotante: number;
  stockReal: number;
  lote: string;
  vencimiento: string;
  status: "Activo" | "Por vencer" | "Vencido";
  categoria: string;
};

export type SaleItemType = {
  id: string;
  codigo: string;
  cliente: string;
  monto: number;
  fecha: string;
  status: "Completado" | "Pendiente" | "Cancelado";
  vendedor: string;
};

export type AlertItemType = {
  id: string;
  producto: string;
  categoria: string;
  stockActual: number;
  stockMinimo: number;
  fecha: string;
  periodoAgotamiento: string;
  tendenciaConsumo: "Alta" | "Moderada" | "Baja";
  status: "Alto" | "Medio" | "Bajo";
}