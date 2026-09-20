import { useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import { toast } from "sonner";
import { useAuthStore } from "@/features/auth/store";
import { MainPageSkeleton } from "@/components/skeletons/MainPageSkeleton";

export function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isCheckingAuth = useAuthStore((s) => s.isCheckingAuth);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    const handleExpired = () => {
      toast.error("Su sesión ha expirado. Por favor, vuelva a iniciar sesión.");
      useAuthStore.getState().handleSessionExpired();
    };

    window.addEventListener("auth:session-expired", handleExpired);
    return () => {
      window.removeEventListener("auth:session-expired", handleExpired);
    };
  }, []);

  if (isCheckingAuth) {
    return <MainPageSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}