import { z } from "zod";

export const ClienteSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(100, "El nombre no puede superar 100 caracteres."),
  apellido: z
    .string()
    .trim()
    .min(1, "El apellido es obligatorio.")
    .max(100, "El apellido no puede superar 100 caracteres."),
  dni: z
    .string()
    .trim()
    .refine((v) => !v || /^\d{8}$/.test(v), {
      message: "El DNI debe contener exactamente 8 dígitos numéricos.",
    })
    .optional(),
  email: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio.")
    .max(254, "El correo no puede superar 254 caracteres.")
    .email("Debe ingresar un correo electrónico válido."),
  telefono: z
    .string()
    .trim()
    .max(20, "El teléfono no puede superar 20 caracteres.")
    .regex(/^[0-9+\- ]*$/, "El teléfono solo puede contener dígitos, +, - y espacios.")
    .optional(),
  direccion: z
    .string()
    .trim()
    .max(200, "La dirección no puede superar 200 caracteres.")
    .optional(),
});

export type ClienteInput = z.infer<typeof ClienteSchema>;
