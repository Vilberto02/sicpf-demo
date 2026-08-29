import { useEffect, useState } from "react";
import { ShieldCheck, Plus, KeyRound, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/DataTable";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/features/auth/store";
import { useUsersStore } from "@/features/users/store";
import type { UsuarioItemType } from "@/features/users/types";

type UserFormState = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  username: string;
  password: string;
  rol: string;
  sede: string;
};

const EMPTY_FORM: UserFormState = {
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  username: "",
  password: "",
  rol: "",
  sede: "",
};

export function UsersSection() {
  const { items, roles, sedes, fetchItems, fetchRoles, fetchSedes, addItem, updateItem, removeItem, toggleActive, loading } =
    useUsersStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UsuarioItemType | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);

  useEffect(() => {
    fetchItems();
    fetchRoles();
    fetchSedes();
  }, [fetchItems, fetchRoles, fetchSedes]);

  const openCreateDialog = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: UsuarioItemType) => {
    setEditingUser(user);
    setForm({
      nombre: user.nombre ?? "",
      apellido: user.apellido ?? "",
      email: user.email ?? "",
      telefono: user.telefono ?? "",
      username: user.user_username ?? "",
      password: "",
      rol: user.rol ? String(user.rol) : "",
      sede: user.sede ? String(user.sede) : "",
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.nombre.trim() || !form.email.trim() || !form.username.trim()) {
      toast.error("Nombre, email y usuario son obligatorios.");
      return;
    }
    if (!editingUser && !form.password) {
      toast.error("Debes definir una contraseña inicial.");
      return;
    }

    const payload: Partial<UsuarioItemType> = {
      nombre: form.nombre.trim(),
      apellido: form.apellido.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim() || null,
      username: form.username.trim(),
      rol: form.rol ? Number(form.rol) : null,
      sede: form.sede ? Number(form.sede) : null,
      ...(form.password ? { password: form.password } : {}),
    };

    const result = editingUser
      ? await updateItem(editingUser.id, payload)
      : await addItem(payload);

    if (result) {
      const authState = useAuthStore.getState();
      if (editingUser && authState.userProfile?.id === editingUser.id) {
        authState.fetchProfile();
      }

      toast.success(
        editingUser ? "Usuario actualizado correctamente." : "Usuario creado correctamente."
      );
      setIsDialogOpen(false);
    } else {
      toast.error("No se pudo guardar el usuario.");
    }
  };

  const handleDelete = async (row: UsuarioItemType) => {
    const { default: Swal } = await import("sweetalert2");

    const result = await Swal.fire({
      title: "¿Eliminar usuario?",
      text: `Se eliminará el acceso de "${row.nombre} ${row.apellido}". Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    const ok = await removeItem(row.id);
    if (ok) {
      toast.success("Usuario eliminado correctamente.");
    } else {
      toast.error("No se pudo eliminar el usuario.");
    }
  };

  const handleToggleActive = async (row: UsuarioItemType) => {
    await toggleActive(row.id, !row.is_active);
    toast.success(
      row.is_active
        ? `Acceso desactivado para ${row.nombre} ${row.apellido}.`
        : `Acceso reactivado para ${row.nombre} ${row.apellido}.`
    );
  };

  const getEstadoBadge = (activo: boolean) => (
    <span
      className={`px-2 py-1 rounded-full text-xs font-medium border ${
        activo
          ? "bg-green-100 text-green-800 border-green-200"
          : "bg-gray-100 text-gray-500 border-gray-200"
      }`}
    >
      {activo ? "Activo" : "Inactivo"}
    </span>
  );

  const userColumns: ColumnDef<UsuarioItemType>[] = [
    {
      accessorKey: "nombre",
      header: "Nombre",
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">
            {row.original.nombre} {row.original.apellido}
          </span>
          <span className="text-xs text-muted-foreground">
            @{row.original.user_username || "-"}
          </span>
        </div>
      ),
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      id: "categoria",
      accessorKey: "rol_nombre",
      header: "Rol",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <Select
            value={user.rol ? String(user.rol) : undefined}
            onValueChange={async (rolId) => {
              const updated = await updateItem(user.id, { rol: Number(rolId) });
              if (updated) {
                const authState = useAuthStore.getState();
                if (authState.userProfile?.id === user.id) {
                  authState.fetchProfile();
                }
                toast.success(
                  `Rol delegado: ${updated.nombre} ahora es ${
                    roles.find((r) => r.id === Number(rolId))?.nombre ?? "sin rol"
                  }.`
                );
              } else {
                toast.error("No se pudo delegar el rol.");
              }
            }}
          >
            <SelectTrigger className="w-40 h-8 cursor-pointer">
              <SelectValue placeholder="Sin rol" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((rol) => (
                <SelectItem key={rol.id} value={String(rol.id)}>
                  {rol.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    {
      id: "status",
      accessorFn: (row) => (row.is_active ? "Activo" : "Inactivo"),
      header: "Estado",
      cell: ({ row }) => getEstadoBadge(row.original.is_active),
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={() => openEditDialog(user)}
              title="Editar"
            >
              <KeyRound className="h-4 w-4 text-blue-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={() => handleToggleActive(user)}
              title={user.is_active ? "Desactivar acceso" : "Reactivar acceso"}
            >
              <ShieldCheck
                className={`h-4 w-4 ${user.is_active ? "text-green-600" : "text-stone-400"}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={() => handleDelete(user)}
              title="Eliminar usuario"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-8 min-w-0 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-3 items-center text-3xl text-primary font-semibold tracking-tight">
          <ShieldCheck width={36} height={36} />
          <h3 className="mt-1">Usuarios</h3>
        </div>

        <Button
          className="cursor-pointer flex gap-2 items-center w-full md:w-auto shadow-sm"
          onClick={openCreateDialog}
        >
          <Plus /> Agregar usuario
        </Button>
      </div>

      <DataTable
        columns={userColumns}
        data={items}
        searchPlaceholder="Buscar por nombre o email"
        categories={roles.map((r) => r.nombre)}
        statusHeaderProps="Estado"
        loading={loading}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? "Editar usuario" : "Nuevo usuario"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  required
                  value={form.nombre}
                  placeholder="Ej. Maria"
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input
                  value={form.apellido}
                  placeholder="Ej. Franco"
                  onChange={(e) => setForm({ ...form, apellido: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                required
                value={form.email}
                placeholder="Ej. maria@farmacia.com"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Usuario</Label>
                <Input
                  required
                  value={form.username}
                  placeholder="Ej. mfranco"
                  onChange={(e) => setForm({ ...form, username: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Contraseña{" "}
                  {editingUser && (
                    <span className="text-xs text-muted-foreground font-normal">
                      (Sin cambios)
                    </span>
                  )}
                </Label>
                <Input
                  type="password"
                  required={!editingUser}
                  value={form.password}
                  placeholder="********"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={form.telefono}
                  placeholder="Ej. 999888777"
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Rol</Label>
                <Select
                  value={form.rol || undefined}
                  onValueChange={(rol) => setForm({ ...form, rol })}
                >
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((rol) => (
                      <SelectItem key={rol.id} value={String(rol.id)}>
                        {rol.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Sede</Label>
              <Select
                value={form.sede || "none"}
                onValueChange={(sede) =>
                  setForm({ ...form, sede: sede === "none" ? "" : sede })
                }
              >
                <SelectTrigger className="w-full cursor-pointer">
                  <SelectValue placeholder="Selecciona una sede" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin sede</SelectItem>
                  {sedes.map((sede) => (
                    <SelectItem key={sede.id} value={String(sede.id)}>
                      {sede.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit" className="cursor-pointer">
                {editingUser ? "Guardar cambios" : "Crear usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
