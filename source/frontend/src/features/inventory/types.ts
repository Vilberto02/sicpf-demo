export type InventoryItemType = {
  id?: number;
  codigo: string;
  nombre: string;
  stock_flotante: number;
  stock_real: number;
  lote: string;
  vencimiento: string;
  status: "Activo" | "Por vencer" | "Vencido";
  categoria: string;
};
