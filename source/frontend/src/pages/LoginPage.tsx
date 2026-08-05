import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { LoginFields } from "@/types/types";
import { useState, useEffect } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { Navigate } from "react-router";
import { useAuthStore } from "@/features/auth/store";

export function LoginPage() {
  const [redirect, setRedirect] = useState<boolean>(false);
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm<LoginFields>({
    mode: "onChange",
  });

  const { loginUser, isAuthenticated, error } = useAuthStore();

  const onSubmit: SubmitHandler<LoginFields> = async (data) => {
    await loginUser({ username: data.email, password: data.password });
  };

  useEffect(() => {
    if (isAuthenticated) {
      setRedirect(true);
    }
  }, [isAuthenticated]);

  if (redirect) return <Navigate to="/"></Navigate>;

  return (
    <div className="relative flex items-center justify-center w-screen h-screen bg-white border-2 overflow-hidden">
      <div className="w-[364px] h-[364px] absolute -left-50 -top-50 rounded-full  bg-linear-to-b from-white to-[#70B2B2]"></div>

      <div className="w-[364px] h-[364px] absolute -left-40 top-20 rounded-full  bg-linear-to-b from-white to-[#70B2B2]"></div>

      <div className="w-[364px] h-[364px] absolute -right-10 -bottom-50 rounded-full  bg-linear-to-b from-white to-[#70B2B2]"></div>

      <div className="w-[364px] h-[364px] absolute -right-50 bottom-0 rounded-full  bg-linear-to-b from-white to-[#70B2B2]"></div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className=" max-w-md flex flex-col border-2 p-9 gap-6 rounded-3xl border-primary/40 backdrop-blur-lg shadow-lg bg-white/25"
      >
        <h1 className="text-center text-quaternary text-3xl font-bold">
          Sistema Gestión Farmacéutica
        </h1>
        <p className="text-base font-normal text-[#424242] text-center">
          Registra su correo electrónico y contraseña para acceder a la
          plataforma
        </p>
        <div className="space-y-4">
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            placeholder="Ingrese su correo electrónico"
            type="email"
            {...register("email", {
              required: {
                value: true,
                message: "El correo eletrónico es requerido.",
              },
              pattern: {
                value: /^[\w.-]+@[a-zA-Z\d.-]+\.[a-zA-Z]{2,}$/,
                message: "Correo inválido.",
              },
            })}
          ></Input>
          {errors.email && (
            <span className="text-sm text-red-700 ml-2">
              {errors.email.message}
            </span>
          )}
        </div>
        <div className="space-y-4">
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            placeholder="Ingresa tu contraseña"
            type="password"
            {...register("password", {
              required: {
                value: true,
                message: "La constraseña es requerida.",
              },
            })}
          ></Input>
          {errors.password && (
            <span className="text-sm text-red-700 ml-2">
              {errors.password.message}
            </span>
          )}
        </div>
        {error && (
          <span className="text-sm text-red-700 text-center font-semibold">
            {error}
          </span>
        )}
        <Button variant={"default"} className="cursor-pointer">
          Continuar
        </Button>
      </form>
    </div>
  );
}
