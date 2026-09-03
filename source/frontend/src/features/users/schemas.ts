import { z } from "zod";

export const CreateUserSchema = z.object({
  nombre: z
    .string()
    .trim()
    .min(1, "El nombre es obligatorio.")
    .max(100, "El nombre no puede superar 100 caracteres."),
  apellido: z
    .string()
    .trim()
    .max(100, "El apellido no puede superar 100 caracteres.")
    .optional(),
  email: z
    .string()
    .trim()
    .min(1, "El correo es obligatorio.")
    .max(254, "El correo no puede superar 254 caracteres.")
    .email("Debe ingresar un correo electrónico válido."),
  username: z
    .string()
    .trim()
    .min(3, "El usuario debe tener al menos 3 caracteres.")
    .max(150, "El usuario no puede superar 150 caracteres.")
    .regex(
      /^[\w.@+-]+$/,
      "El usuario solo puede contener letras, números y . _ @ + -"
    ),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(128, "La contraseña no puede superar 128 caracteres."),
  telefono: z
    .string()
    .trim()
    .max(20, "El teléfono no puede superar 20 caracteres.")
    .regex(/^[0-9+\- ]*$/, "El teléfono solo puede contener dígitos, +, - y espacios.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  rol: z.union([z.number(), z.string(), z.null()]).optional(),
  sede: z.union([z.number(), z.string(), z.null()]).optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UpdateUserSchema = CreateUserSchema.partial().omit({ password: true }).extend({
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(128, "La contraseña no puede superar 128 caracteres.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;

export const UserFormSchema = z.object({
  nombre: z.string().trim().min(1, "El nombre es obligatorio."),
  apellido: z.string().trim(),
  email: z.string().trim().min(1, "El correo es obligatorio.").email("Debe ingresar un correo electrónico válido."),
  telefono: z.string().trim(),
  username: z.string().trim().min(3, "El usuario debe tener al menos 3 caracteres."),
  password: z.string(),
  rol: z.string(),
  sede: z.string(),
});

export type UserFormState = z.infer<typeof UserFormSchema>;

export const ChangeUserPasswordSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres.")
      .max(128, "La nueva contraseña no puede superar 128 caracteres."),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "La confirmación no coincide con la nueva contraseña.",
    path: ["confirm_password"],
  });

export type ChangeUserPasswordInput = z.infer<typeof ChangeUserPasswordSchema>;
