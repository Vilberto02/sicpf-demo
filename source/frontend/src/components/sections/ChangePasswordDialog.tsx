import { useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuthStore } from "@/features/auth/store";
import { ChangePasswordSchema } from "@/features/auth/schemas";

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { changeOwnPassword, logoutUser } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordErrors({});
    setIsSubmitting(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      resetForm();
    }
    onOpenChange(next);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = ChangePasswordSchema.safeParse({
      current_password: currentPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        fieldErrors[key] = issue.message;
      }
      setPasswordErrors(fieldErrors);
      return;
    }
    setPasswordErrors({});
    setIsSubmitting(true);
    try {
      const result = await changeOwnPassword({
        current_password: parsed.data.current_password,
        new_password: parsed.data.new_password,
      });
      if (result.logoutRequired) {
        toast.success("Contraseña actualizada. Inicia sesión nuevamente.");
        logoutUser();
        navigate("/login");
        return;
      }
      toast.success("Contraseña actualizada correctamente.");
      handleOpenChange(false);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "No se pudo cambiar la contraseña."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-card rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-stone-600" />
            Cambiar contraseña
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleChangePassword} className="flex flex-col gap-4 py-2">
          <div className="space-y-2">
            <Label>Contraseña actual</Label>
            <Input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Coloca tu contraseña actual."
              autoComplete="current-password"
            />
            {passwordErrors.current_password && (
              <span className="text-sm text-red-700 ml-2">{passwordErrors.current_password}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label>Nueva contraseña</Label>
            <Input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Coloca tu nueva contraseña."
              autoComplete="new-password"
            />
            {passwordErrors.new_password && (
              <span className="text-sm text-red-700 ml-2">{passwordErrors.new_password}</span>
            )}
          </div>
          <div className="space-y-2">
            <Label>Confirmar nueva contraseña</Label>
            <Input
              type="password"
              required
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Vuelve a colocar tu nueva contraseña."
              autoComplete="new-password"
            />
            {passwordErrors.confirm_password && (
              <span className="text-sm text-red-700 ml-2">{passwordErrors.confirm_password}</span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            La contraseña debe tener al menos 8 caracteres. Tras el cambio se
            cerrará la sesión para que vuelvas a iniciar con la nueva clave.
          </p>
          <DialogFooter>
            <Button
              type="submit"
              className="cursor-pointer w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}