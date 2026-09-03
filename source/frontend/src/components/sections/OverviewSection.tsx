import { useEffect, useMemo } from "react";
import { ChartNoAxesColumn } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { Skeleton } from "../ui/skeleton";
import { InventoryItem } from "../InventoryItem";
import type { StateType, LevelType } from "../InventoryItem";
import { RecommendationItem } from "../RecommendationItem";
import { BarChart } from "../charts/BarChart";
import { useRecommendationsStore } from "@/features/recommendations/store";
import { useInventoryStore } from "@/features/inventory/store";
import { useAlertsStore } from "@/features/alerts/store";
import { useDashboardStore } from "@/features/dashboard/store";

const LIST_SKELETON_ROWS = 5;

function ListCardSkeleton({ title }: { title: string }) {
  return (
    <div className="bg-card shadow-sm ring-1 ring-black/5 p-5 rounded-xl h-full" aria-hidden="true">
      <h4 className="font-semibold text-neutral-600 mb-4">{title}</h4>
      <div className="flex flex-col gap-2">
        {Array.from({ length: LIST_SKELETON_ROWS }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-2 rounded-md border border-border/60">
            <Skeleton className="h-8 w-8 rounded-md shrink-0" />
            <div className="flex flex-col gap-1.5 flex-1 min-w-0">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-16 rounded-full shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewSectionSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-hidden="true">
      <div className="flex gap-2 items-center">
        <Skeleton className="h-[42px] w-[42px] rounded-full" />
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>
      <div className="flex flex-col gap-6 min-w-0">
        <div className="bg-card shadow-sm ring-1 ring-black/5 p-5 rounded-xl w-full min-w-0">
          <Skeleton className="h-72 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ListCardSkeleton title="Estado de los productos" />
          <ListCardSkeleton title="Nivel de riesgo de los productos" />
          <ListCardSkeleton title="Recomendaciones" />
        </div>
      </div>
    </div>
  );
}

export function OverviewSection() {
  const { chartData, fetchChartData, loading: chartLoading } = useDashboardStore();

  const { items: recItems, fetchItems: fetchRec, loading: recLoading } = useRecommendationsStore();
  const { items: invItems, fetchItems: fetchInv, loading: invLoading } = useInventoryStore();
  const { items: alertItems, fetchItems: fetchAlert, loading: alertsLoading } = useAlertsStore();

  useEffect(() => {
    fetchRec();
    fetchInv();
    fetchAlert();
    fetchChartData();
  }, [fetchRec, fetchInv, fetchAlert, fetchChartData]);

  const filteredAndSortedInvItems = useMemo(
    () =>
      invItems
        .filter((product) => product.producto_estado === "vencido" || product.producto_estado === "por vencer")
        .sort((a, b) => {
          if (a.producto_estado === "vencido" && b.producto_estado !== "vencido") return -1;
          if (a.producto_estado !== "vencido" && b.producto_estado === "vencido") return 1;
          return 0;
        }),
    [invItems]
  );

  if (chartLoading || recLoading || invLoading || alertsLoading) {
    return <OverviewSectionSkeleton />;
  }

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
                {filteredAndSortedInvItems.length === 0 ? (
                  <p className="text-sm text-muted-foreground mt-4">Aún no hay productos con estados críticos registrados.</p>
                ) : (
                  filteredAndSortedInvItems.map((product) => (
                    <InventoryItem
                      key={product.codigo_lote}
                      variant="state"
                      code={product.producto_codigo}
                      title={product.producto_nombre}
                      state={product.producto_estado as StateType}
                    ></InventoryItem>
                  ))
                )}
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
                      level={product.nivel_riesgo as LevelType}
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
                      title={recommendation.titulo}
                      description={recommendation.descripcion}
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
