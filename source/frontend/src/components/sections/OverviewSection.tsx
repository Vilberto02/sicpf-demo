import { ChartNoAxesColumn } from "lucide-react";

export function OverviewSection() {
  return (
    <div className="">
      <div className="flex gap-2 items-center text-3xl text-primary font-semibold">
        <ChartNoAxesColumn width={42} height={42}></ChartNoAxesColumn>
        <h3>General</h3>
      </div>
      <div className="mt-6 grid grid-cols-3 grid-rows-3 gap-6">
        <div className="border-2 rounded-2xl border-neutral-400 w-full p-4 col-span-3 row-span-2">
          Gráfica de barras
        </div>
        <div className="border-2 rounded-2xl border-neutral-400 w-full p-4">
          Tarjeta de estado de productos
        </div>
        <div className="border-2 rounded-2xl border-neutral-400 w-full p-4">
          Tarjeta de nivel de riesgo de productos
        </div>
        <div className="border-2 rounded-2xl border-neutral-400 w-full p-4">
          Recomendaciones de la IA
        </div>
      </div>
    </div>
  );
}