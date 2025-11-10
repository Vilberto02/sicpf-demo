import { ChartNoAxesColumn } from "lucide-react";
import { ScrollArea } from "../ui/scroll-area";
import { InventoryItem } from "../InventoryItem";
import { RecommendationItem } from "../RecommendationItem";
import { productRisk, productStatus, recommendations } from "@/mocks";

export function OverviewSection() {
  return (
    <div className="h-full">
      <div className="flex gap-2 items-center text-3xl text-primary font-semibold">
        <ChartNoAxesColumn width={42} height={42}></ChartNoAxesColumn>
        <h3>General</h3>
      </div>
      <div className="mt-6 flex flex-col gap-6 h-full">
        <div className="border-2 rounded-2xl border-neutral-400 p-4">
          Gráfica de barras
          <div className="h-64"></div>
        </div>
        <div className="flex gap-6">
          <div className="border-2 rounded-2xl border-neutral-400 p-4 grow h-full">
            <h4 className="font-semibold text-neutral-600 mb-4">
              Estado de los productos
            </h4>
            <ScrollArea className="h-72">
              <div className="flex flex-col gap-2 pr-3">
                {
                  productStatus.map((product) => (
                    <InventoryItem key={product.code} variant="state" code={product.code} title={product.title} state={product.state} ></InventoryItem>
                  ))
                }
              </div>
            </ScrollArea>
          </div>
          <div className="border-2 rounded-2xl border-neutral-400 p-4 grow h-full">
            <h4 className="font-semibold text-neutral-600 mb-4">
              Nivel de riesgo de los productos
            </h4>
            <ScrollArea className="h-72">
              <div className="flex flex-col gap-2 pr-3">
                {
                  productRisk.map((product) => (
                    <InventoryItem key={product.id} variant="level" title={product.title} level={product.level}></InventoryItem>
                  ))
                }
              </div>
            </ScrollArea>
          </div>
          <div className="border-2 rounded-2xl border-neutral-400 p-4 grow h-full">
            <h4 className="font-semibold text-neutral-600 mb-4">
              Recomendaciones
            </h4>
            <ScrollArea className="h-72">
              <div className="flex flex-col gap-2 pr-3">
                {
                  recommendations.map((recommendation) => (
                    <RecommendationItem key={recommendation.id} title={recommendation.title} description={recommendation.description}></RecommendationItem>
                  ))
                }
              </div>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}