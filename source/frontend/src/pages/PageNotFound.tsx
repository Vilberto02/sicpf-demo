import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";

export function PageNotFound() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-4">
      <h1 className="text-6xl font-bold text-primary">404</h1>
      <p className="text-lg text-muted-foreground">Página no encontrada</p>
      <Button onClick={() => navigate("/")} className="cursor-pointer">
        Volver al inicio
      </Button>
    </div>
  );
}