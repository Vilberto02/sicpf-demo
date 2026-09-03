import {
  Package,
  ShoppingCart,
  TrendingDown,
  TriangleAlert,
  ReceiptText,
} from "lucide-react";
import { CardDashboard } from "../CardDashboard";
import { AnimatedCounter } from "../AnimatedCounter";
import { DoughnutChart } from "../charts/DougnutChart";
import { BarChart } from "../charts/BarChart";
import type { SalesStatsType } from "@/features/shared/statsTypes";
import type { InventoryStatsType } from "@/features/shared/statsTypes";
import type { AlertsStatsType } from "@/features/shared/statsTypes";
import type { MySalesStatsType } from "@/features/shared/statsTypes";
import type { InventoryCategoriesType } from "@/features/shared/statsTypes";
import type { DashboardChartType } from "@/features/shared/statsTypes";

const COLORS = [
  "#DBAEFF",
  "#D0E8FF",
  "#FBE38E",
  "#A9F4D0",
  "#FFB6C1",
  "#98FB98",
  "#FFDAB9",
  "#E6E6FA",
];

type ProfileDashboardProps = {
  isAdminUser: boolean;
  salesStats?: SalesStatsType | null;
  invStats?: InventoryStatsType | null;
  alertsStats?: AlertsStatsType | null;
  myStats?: MySalesStatsType | null;
  categories?: InventoryCategoriesType | null;
  chartData?: DashboardChartType | null;
};

export function ProfileDashboard({
  isAdminUser,
  salesStats,
  invStats,
  alertsStats,
  myStats,
  categories,
  chartData,
}: ProfileDashboardProps) {
  if (isAdminUser) {
    return (
      <>
        <div className="flex flex-col md:grid md:grid-cols-2 gap-4 w-full min-w-0">
          <CardDashboard
            title="Pedidos procesados"
            value={<AnimatedCounter value={salesStats?.total_orders ?? 0} />}
            Icon={ShoppingCart}
            variant="default"
          ></CardDashboard>
          <CardDashboard
            title="Productos ingresados"
            value={<AnimatedCounter value={invStats?.total_lotes ?? 0} />}
            Icon={Package}
            variant="info"
          ></CardDashboard>
          <CardDashboard
            title="Productos en riesgo"
            value={<AnimatedCounter value={alertsStats?.at_risk ?? 0} />}
            Icon={TriangleAlert}
            variant="danger"
          ></CardDashboard>
          <CardDashboard
            title="Quiebres estimados"
            value={<AnimatedCounter value={alertsStats?.quiebres_estimados ?? 0} />}
            Icon={TrendingDown}
            variant="success"
          ></CardDashboard>
        </div>

        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full p-5 min-w-0">
          <DoughnutChart
            colors={COLORS.slice(0, categories?.labels?.length || 4)}
            values={categories?.values ?? []}
            labels={categories?.labels ?? []}
          ></DoughnutChart>
        </div>
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full p-5 min-w-0">
          <BarChart
            dataset01={chartData?.dataset01 ?? []}
            dataset02={chartData?.dataset02 ?? []}
            label={chartData?.labels ?? []}
          ></BarChart>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col md:grid md:grid-cols-2 gap-4 w-full min-w-0">
        <CardDashboard
          title="Mis ventas del mes"
          value={<AnimatedCounter value={myStats?.month_orders ?? 0} />}
          Icon={ShoppingCart}
          variant="default"
        ></CardDashboard>
        <CardDashboard
          title="Mi facturación del mes"
          value={
            <span className="text-2xl tabular-nums">
              S/{" "}
              <AnimatedCounter
                value={myStats?.month_revenue ?? 0}
                isFloat
              />
            </span>
          }
          Icon={ReceiptText}
          variant="info"
        ></CardDashboard>
        <CardDashboard
          title="Pedidos completados"
          value={<AnimatedCounter value={myStats?.completed_orders ?? 0} />}
          Icon={Package}
          variant="success"
        ></CardDashboard>
        <CardDashboard
          title="Pedidos totales"
          value={<AnimatedCounter value={myStats?.total_orders ?? 0} />}
          Icon={TrendingDown}
          variant="warning"
        ></CardDashboard>
      </div>

      <RecentSalesCard sales={myStats?.recent_sales ?? []} />
    </>
  );
}

type RecentSale = {
  id?: number;
  cliente_nombre?: string;
  codigo?: string;
  fecha?: string;
  estado?: string;
  total?: string | number;
};

function RecentSalesCard({ sales }: { sales: RecentSale[] }) {
  return (
    <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full p-5 min-w-0 flex flex-col gap-4">
      <h4 className="font-semibold text-neutral-600">Mis últimas ventas</h4>
      <div className="flex flex-col divide-y divide-border">
        {sales.map((venta) => (
          <div key={venta.id} className="flex items-center justify-between py-3 px-1">
            <div className="min-w-0">
              <p className="font-medium truncate">{venta.cliente_nombre}</p>
              <p className="text-xs text-muted-foreground">
                {venta.codigo} · {venta.fecha?.slice(0, 10)} · {venta.estado}
              </p>
            </div>
            <span className="font-semibold text-primary tabular-nums shrink-0 ml-4">
              S/{Number(venta.total).toFixed(2)}
            </span>
          </div>
        ))}
        {sales.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aún no registras ventas.
          </p>
        )}
      </div>
    </div>
  );
}