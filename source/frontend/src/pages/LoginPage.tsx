import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Navigate } from "react-router";
import { useAuthStore } from "@/features/auth/store";
import { toast } from "sonner";
import { LoginSchema, type LoginInput } from "@/features/auth/schemas";
import { Loader2 } from "lucide-react";

export function LoginPage() {
  const [redirect, setRedirect] = useState<boolean>(false);
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm<LoginInput>({
    mode: "onChange",
    resolver: zodResolver(LoginSchema),
  });

  const { loginUser, isAuthenticated, error, isLoading, clearError } = useAuthStore();
  const isPending = isSubmitting || isLoading;

  const onSubmit: SubmitHandler<LoginInput> = async (data) => {
    try {
      await loginUser({ username: data.username, password: data.password });
    } catch {
      // Uncaught errors handled gracefully
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      toast.success("Has iniciado sesión exitosamente.");
      setRedirect(true);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      clearError();
    }
  }, [error, clearError]);

  if (redirect) return <Navigate to="/"></Navigate>;

  return (
    <div className="relative flex items-center justify-center w-screen h-screen bg-background overflow-hidden">
      <div className="w-[364px] h-[364px] absolute -left-50 -top-50 rounded-full  bg-linear-to-b from-white to-[#70B2B2]"></div>

      <div className="w-[364px] h-[364px] absolute -left-40 top-20 rounded-full  bg-linear-to-b from-white to-[#70B2B2]"></div>

      <div className="w-[364px] h-[364px] absolute -right-10 -bottom-50 rounded-full  bg-linear-to-b from-white to-[#70B2B2]"></div>

      <div className="w-[364px] h-[364px] absolute -right-50 bottom-0 rounded-full  bg-linear-to-b from-white to-[#70B2B2]"></div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="z-10 w-full max-w-md flex flex-col p-10 gap-6 rounded-2xl bg-card ring-1 ring-black/5 shadow-xl mx-4"
      >
        <h1 className="text-center text-primary text-3xl font-semibold tracking-tight">
          Gestión Farmacéutica
        </h1>
        <p className="text-sm font-medium text-muted-foreground text-center">
          Registra tu correo electrónico y contraseña para acceder a la
          plataforma.
        </p>
        <div className="space-y-4">
          <Label htmlFor="username">Nombre de usuario</Label>
          <Input
            id="username"
            placeholder="Ingrese su usuario"
            type="text"
            disabled={isPending}
            {...register("username", {
              required: {
                value: true,
                message: "El usuario es requerido.",
              },
            })}
          ></Input>
          {errors.username && (
            <span className="text-sm text-red-700 ml-2">
              {errors.username.message}
            </span>
          )}
        </div>
        <div className="space-y-4">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            placeholder="Ingresa tu contraseña"
            type="password"
            disabled={isPending}
            {...register("password", {
              required: {
                value: true,
                message: "La contraseña es requerida.",
              },
            })}
          ></Input>
          {errors.password && (
            <span className="text-sm text-red-700 ml-2">
              {errors.password.message}
            </span>
          )}
        </div>
        <Button
          type="submit"
          variant={"default"}
          disabled={isPending}
          className="w-full mt-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 transition-all flex items-center justify-center gap-2"
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Iniciando sesión...</span>
            </>
          ) : (
            "Continuar"
          )}
        </Button>
      </form>
    </div>
  );
}
