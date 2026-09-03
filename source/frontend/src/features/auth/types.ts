export type AuthResponse = {
  access: string;
  refresh: string;
};

export type UserProfileType = {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  role: string;
  location?: string | null;
  employee_id?: string | null;
  date_joined?: string;
  sede?: {
    id: number;
    nombre?: string;
  } | number | null;
} & Record<string, unknown>;