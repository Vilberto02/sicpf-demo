import { useEffect } from "react";
import {
  Plus,
  ShoppingCart,
  ShoppingBasket,
  Clock8,
  CircleCheckBig,
  DollarSign,
} from "lucide-react";
import { Button } from "../ui/button";
import { CardDashboard } from "../CardDashboard";
import { SalesTable } from "../table/SalesTable";
import { useSalesStore } from "@/features/sales/store";
import { AnimatedCounter } from "../AnimatedCounter";

export function SaleSection({ onNewSale }: { onNewSale?: () => void }) {
  const { stats, fetchStats } = useSalesStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="flex flex-col gap-8 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-3 items-center text-3xl text-primary font-semibold tracking-tight">
          <ShoppingCart width={36} height={36}></ShoppingCart>
          <h3 className="mt-1">Ventas</h3>
        </div>

        <Button
          onClick={onNewSale}
          className="cursor-pointer flex gap-2 items-center w-full md:w-auto shadow-sm"
        >
          <Plus></Plus> Agregar venta
        </Button>
      </div>

      <div className="flex flex-col sm:grid sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={ShoppingBasket}
            title="Total de pedidos"
            value={<AnimatedCounter value={stats?.total_orders ?? 0} />}
            variant="default"
          ></CardDashboard>
        </div>
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={Clock8}
            title="Pedidos pendientes"
            value={<AnimatedCounter value={stats?.pending_orders ?? 0} />}
            variant="warning"
          ></CardDashboard>
        </div>
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={CircleCheckBig}
            title="Pedidos completados"
            value={<AnimatedCounter value={stats?.completed_orders ?? 0} />}
            variant="success"
          ></CardDashboard>
        </div>
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={DollarSign}
            title="Total de ventas"
            value={<AnimatedCounter value={stats?.total_revenue ?? 0} isFloat={true} />}
            variant="info"
          ></CardDashboard>
        </div>
      </div>
      <div className="w-full min-w-0">
        <SalesTable></SalesTable>
      </div>
    </div>
  );
}
