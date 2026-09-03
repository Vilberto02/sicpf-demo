import { useEffect } from "react";
import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "@/features/auth/store";
import { MainPageSkeleton } from "@/components/skeletons/MainPageSkeleton";

export function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isCheckingAuth = useAuthStore((s) => s.isCheckingAuth);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  if (isCheckingAuth) {
    return <MainPageSkeleton />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}