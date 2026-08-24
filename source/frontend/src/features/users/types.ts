export type RolItemType = {
  id: number;
  nombre: string;
  descripcion?: string | null;
};

export type UsuarioItemType = {
  id: number;
  user: number;
  user_username?: string | null;
  username?: string;
  password?: string;
  is_active: boolean;
  nombre: string;
  apellido: string;
  email: string;
  telefono?: string | null;
  direccion?: string | null;
  rol: number | null;
  rol_nombre?: string | null;
  sede?: number | null;
};
