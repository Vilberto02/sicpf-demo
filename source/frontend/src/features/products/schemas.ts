import { z } from "zod";

export const ProductSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(1, "El código es obligatorio.")
    .max(50, "El código no puede superar 50 caracteres."),
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(200, "El nombre no puede superar 200 caracteres."),
  descripcion: z
    .string()
    .trim()
    .max(500, "La descripción no puede superar 500 caracteres.")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  dci: z
    .string()
    .trim()
    .max(200, "El DCI no puede superar 200 caracteres.")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  concentracion: z
    .string()
    .trim()
    .max(100, "La concentración no puede superar 100 caracteres.")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  forma_farmaceutica: z
    .string()
    .trim()
    .max(100, "La forma farmacéutica no puede superar 100 caracteres.")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  registro_sanitario: z
    .string()
    .trim()
    .max(50, "El Registro Sanitario no puede superar 50 caracteres.")
    .optional()
    .nullable()
    .transform((v) => (v ? v : null)),
  condicion_venta: z
    .enum(["libre", "receta", "receta_retenida"])
    .default("libre"),
  categoria: z.union([z.number(), z.string()]).refine((v) => v !== "" && Number(v) > 0, {
    message: "Debe seleccionar una categoría.",
  }),
  presentacion: z.union([z.number(), z.string()]).refine((v) => v !== "" && Number(v) > 0, {
    message: "Debe seleccionar una presentación.",
  }),
  precio_real: z
    .union([z.string(), z.number()])
    .refine((v) => Number(v) > 0, "El precio de caja debe ser mayor a 0."),
  precio_flotante: z
    .union([z.string(), z.number()])
    .refine((v) => Number(v) > 0, "El precio por unidad debe ser mayor a 0."),
  precio_blister: z
    .union([z.string(), z.number()])
    .optional()
    .refine((v) => v === undefined || v === "" || Number(v) >= 0, "El precio de blíster no puede ser negativo."),
  unidades_por_caja: z.union([z.string(), z.number()]).refine((v) => Number(v) >= 1, "Debe ser al menos 1."),
  blisters_por_caja: z.union([z.string(), z.number()]).refine((v) => Number(v) >= 1, "Debe ser al menos 1."),
  unidades_por_blister: z.union([z.string(), z.number()]).refine((v) => Number(v) >= 1, "Debe ser al menos 1."),
  presentacion_principal: z.boolean(),
  presentacion_blister: z.boolean(),
  presentacion_unidad: z.boolean(),
});

export type ProductInput = z.infer<typeof ProductSchema>;

export const AtLeastOnePresentacion = z
  .object({
    presentacion_principal: z.boolean(),
    presentacion_blister: z.boolean(),
    presentacion_unidad: z.boolean(),
  })
  .refine(
    (data) => data.presentacion_principal || data.presentacion_blister || data.presentacion_unidad,
    { message: "Debe habilitar al menos una presentación." }
  );
