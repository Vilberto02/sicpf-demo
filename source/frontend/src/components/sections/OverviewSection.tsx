import { useEffect } from "react";
import { ChartNoAxesColumn } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { InventoryItem } from "../InventoryItem";
import { RecommendationItem } from "../RecommendationItem";
import { BarChart } from "../charts/BarChart";
import { useRecommendationsStore } from "@/features/recommendations/store";
import { useInventoryStore } from "@/features/inventory/store";
import { useAlertsStore } from "@/features/alerts/store";
import { useDashboardStore } from "@/features/dashboard/store";
import { useAuthStore } from "@/features/auth/store";

export function OverviewSection() {
  const { chartData, fetchChartData } = useDashboardStore();
  const { fetchProfile } = useAuthStore();

  const { items: recItems, fetchItems: fetchRec } = useRecommendationsStore();
  const { items: invItems, fetchItems: fetchInv } = useInventoryStore();
  const { items: alertItems, fetchItems: fetchAlert } = useAlertsStore();

  useEffect(() => {
    fetchRec();
    fetchInv();
    fetchAlert();
    fetchChartData();
    fetchProfile();
  }, [fetchRec, fetchInv, fetchAlert, fetchChartData, fetchProfile]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 items-center text-3xl text-primary font-semibold">
        <ChartNoAxesColumn width={42} height={42}></ChartNoAxesColumn>
        <h3>General</h3>
      </div>
      <div className="flex flex-col gap-6 min-w-0">
        <div className="bg-card shadow-sm ring-1 ring-black/5 p-5 rounded-xl w-full min-w-0">
          <BarChart
            dataset01={chartData?.dataset01 ?? []}
            dataset02={chartData?.dataset02 ?? []}
            label={chartData?.labels ?? []}
          ></BarChart>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Estado de los productos */}
          <div className="bg-card shadow-sm ring-1 ring-black/5 p-5 rounded-xl h-full">
            <h4 className="font-semibold text-neutral-600 mb-4">
              Estado de los productos
            </h4>
            <ScrollArea className="h-72">
              <div className="flex flex-col gap-2 pr-3">
                {(() => {
                  const filteredAndSortedInvItems = invItems
                    .filter((product) => product.producto_estado === "vencido" || product.producto_estado === "por vencer")
                    .sort((a, b) => {
                      if (a.producto_estado === "vencido" && b.producto_estado !== "vencido") return -1;
                      if (a.producto_estado !== "vencido" && b.producto_estado === "vencido") return 1;
                      return 0;
                    });
                  
                  if (filteredAndSortedInvItems.length === 0) {
                    return <p className="text-sm text-muted-foreground mt-4">Aún no hay productos con estados críticos registrados.</p>;
                  }
                  
                  return filteredAndSortedInvItems.map((product) => (
                    <InventoryItem
                      key={product.codigo_lote}
                      variant="state"
                      code={product.producto_codigo}
                      title={product.producto_nombre}
                      state={product.producto_estado as any}
                    ></InventoryItem>
                  ));
                })()}
              </div>
            </ScrollArea>
          </div>

          {/* Nivel de riesgo de productos */}
          <div className="bg-card shadow-sm ring-1 ring-black/5 p-5 rounded-xl h-full">
            <h4 className="font-semibold text-neutral-600 mb-4">
              Nivel de riesgo de los productos
            </h4>
            <ScrollArea className="h-72">
              <div className="flex flex-col gap-2 pr-3">
                {alertItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-4">Aún no hay alertas registradas.</p>
                ) : (
                  alertItems.map((product) => (
                    <InventoryItem
                      key={product.id}
                      variant="level"
                      title={product.producto_nombre}
                      level={product.nivel_riesgo as any}
                    ></InventoryItem>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Recomendaciones */}
          <div className="bg-card shadow-sm ring-1 ring-black/5 p-5 rounded-xl h-full">
            <h4 className="font-semibold text-neutral-600 mb-4">
              Recomendaciones
            </h4>
            <ScrollArea className="h-72">
              <div className="flex flex-col gap-2 pr-3">
                {recItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-4">Aún no hay recomendaciones emitidas.</p>
                ) : (
                  recItems.map((recommendation) => (
                    <RecommendationItem
                      key={recommendation.id}
                      title={recommendation.title}
                      description={recommendation.description}
                    ></RecommendationItem>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
