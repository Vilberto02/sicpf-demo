import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/features/auth/store";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

interface RoleGuardProps {
  allowedRoles: string[];
  redirectTo?: string;
}

export function RoleGuard({ allowedRoles, redirectTo = "/general" }: RoleGuardProps) {
  const userProfile = useAuthStore((s) => s.userProfile);
  const isCheckingAuth = useAuthStore((s) => s.isCheckingAuth);
  const toastShown = useRef(false);

  const hasAccess =
    userProfile &&
    (allowedRoles.includes(userProfile.role) || userProfile.role === "Superusuario");

  useEffect(() => {
    if (!isCheckingAuth && userProfile && !hasAccess && !toastShown.current) {
      toastShown.current = true;
      toast.error("No tienes permisos de Administrador para acceder a esta sección.");
    }
  }, [isCheckingAuth, userProfile, hasAccess]);

  if (isCheckingAuth) {
    return null;
  }

  if (!hasAccess) {
    return <Navigate to={redirectTo} replace />;
  }

  return <Outlet />;
}
