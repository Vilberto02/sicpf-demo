import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/features/auth/store";
import { useUsersStore } from "@/features/users/store";
import { UpdateProfileSchema } from "@/features/auth/schemas";
import type { UserProfileType } from "@/features/auth/types";

type EditFormState = {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  sede: string;
};

type ProfileEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userProfile: UserProfileType;
  onOpenPassword: () => void;
};

export function ProfileEditDialog({
  open,
  onOpenChange,
  userProfile,
  onOpenPassword,
}: ProfileEditDialogProps) {
  const { editProfile } = useAuthStore();
  const { sedes } = useUsersStore();
  const [editForm, setEditForm] = useState<EditFormState>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    sede: "",
  });
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (open) {
      setEditForm({
        first_name: userProfile.first_name ?? "",
        last_name: userProfile.last_name ?? "",
        email: userProfile.email ?? "",
        phone: userProfile.phone === "No registrado" ? "" : userProfile.phone ?? "",
        sede: userProfile.sede ? String(userProfile.sede) : "",
      });
      setEditErrors({});
    }
  }, [open, userProfile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = UpdateProfileSchema.safeParse({
      first_name: editForm.first_name,
      last_name: editForm.last_name,
      email: editForm.email,
      phone: editForm.phone,
      sede: editForm.sede ? Number(editForm.sede) : null,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        fieldErrors[key] = issue.message;
      }
      setEditErrors(fieldErrors);
      return;
    }
    setEditErrors({});
    const ok = await editProfile({
      first_name: parsed.data.first_name,
      last_name: parsed.data.last_name ?? "",
      email: parsed.data.email,
      phone: parsed.data.phone ?? "",
      sede: parsed.data.sede ? Number(parsed.data.sede) : null,
    });
    if (ok) {
      toast.success("Perfil actualizado correctamente.");
      onOpenChange(false);
      const usersStore = useUsersStore.getState();
      if (usersStore.items.length > 0) {
        usersStore.fetchItems();
      }
    } else {
      toast.error("No se pudo actualizar el perfil.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar perfil</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                required
                value={editForm.first_name}
                onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
              />
              {editErrors.first_name && (
                <span className="text-sm text-red-700 ml-2">{editErrors.first_name}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>Apellido</Label>
              <Input
                value={editForm.last_name}
                onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
              />
              {editErrors.last_name && (
                <span className="text-sm text-red-700 ml-2">{editErrors.last_name}</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              required
              value={editForm.email}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
            {editErrors.email && (
              <span className="text-sm text-red-700 ml-2">{editErrors.email}</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Teléfono</Label>
              <Input
                value={editForm.phone}
                placeholder="Ej. 999888777"
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
              {editErrors.phone && (
                <span className="text-sm text-red-700 ml-2">{editErrors.phone}</span>
              )}
            </div>
            <div className="space-y-2">
              <Label>Sede</Label>
              <Select
                value={editForm.sede || "none"}
                onValueChange={(sede) =>
                  setEditForm({ ...editForm, sede: sede === "none" ? "" : sede })
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
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer w-full gap-2"
              onClick={() => {
                onOpenChange(false);
                onOpenPassword();
              }}
            >
              <KeyRound className="h-4 w-4" />
              Cambiar contraseña
            </Button>
            <Button type="submit" className="cursor-pointer w-full">
              Guardar cambios
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}