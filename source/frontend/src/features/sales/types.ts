export type SaleItemType = {
  id?: number;
  codigo: string;
  cliente: string;
  monto: number;
  fecha: string;
  status: "Completado" | "Pendiente" | "Cancelado";
  vendedor: string;
};
