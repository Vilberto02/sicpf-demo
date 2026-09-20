export interface MetodoPagoType {
  id: number;
  nombre: string;
  descripcion?: string | null;
  is_active?: boolean;
}
