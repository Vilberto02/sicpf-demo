import { z } from "zod";

export const SaleDetailSchema = z.object({
  producto: z.number().int().positive(),
  lote: z.number().int().positive(),
  cantidad_real: z.number().min(0).optional(),
  cantidad_flotante: z.number().min(0).optional(),
  cantidad_blister: z.number().min(0).optional(),
  precio_real: z.number().min(0).optional(),
  precio_flotante: z.number().min(0).optional(),
  precio_blister: z.number().min(0).optional(),
});

export type SaleDetailInput = z.infer<typeof SaleDetailSchema>;

export const CreateSaleSchema = z.object({
  codigo: z.string().trim().min(1, "El código de venta es obligatorio.").max(50),
  cliente: z.number().int().positive("Debe seleccionar un cliente."),
  usuario: z.number().int().positive().optional(),
  total: z.number().min(0, "El total no puede ser negativo."),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida."),
  estado: z.string().min(1).max(20).optional(),
  detalles_write: z
    .array(SaleDetailSchema)
    .min(1, "La venta debe tener al menos un detalle."),
});

export type CreateSaleInput = z.infer<typeof CreateSaleSchema>;
