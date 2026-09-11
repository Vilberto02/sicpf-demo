export type ProductoType = {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  precio_real: string | number;
  precio_flotante: string | number;
  precio_blister: string | number;
  unidades_por_caja: number;
  unidades_por_blister: number;
  blisters_por_caja: number;
  presentacion_principal: boolean;
  presentacion_blister: boolean;
  presentacion_unidad: boolean;
  estado: "activo" | "por vencer" | "vencido";
  presentacion: number;
  presentacion_nombre?: string;
  categoria: number;
  categoria_nombre?: string;
  tipo_producto?: string;
  marcas_disponibles?: string[];
  created_at?: string;
};

export type { MarcaType } from "@/types/types";

export type CategoriaType = {
  id: number;
  nombre: string;
};

export type PresentacionType = {
  id: number;
  nombre: string;
  abreviatura: string | null;
};
