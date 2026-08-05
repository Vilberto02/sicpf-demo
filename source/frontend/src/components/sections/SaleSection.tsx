import { useEffect } from "react";
import { Plus, ShoppingCart, ShoppingBasket, Clock8, CircleCheckBig, DollarSign } from "lucide-react";
import { Button } from "../ui/button";
import { CardDashboard } from "../CardDashboard";
import { SalesTable } from "../table/SalesTable";
import { useSalesStore } from "@/features/sales/store";

export function SaleSection() {
  const { stats, fetchStats } = useSalesStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center text-3xl text-primary font-semibold">
          <ShoppingCart width={42} height={42}></ShoppingCart>
          <h3>Ventas</h3>
        </div>
        <Button className="cursor-pointer">
          <Plus></Plus> Agregar venta
        </Button>
      </div>
      <div className="mt-6 flex flex-col gap-9">
        <div className="flex flex-col sm:grid sm:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
          <CardDashboard
            Icon={ShoppingBasket}
            title="Total de pedidos"
            value={stats?.total_orders ?? "0"}
            variant="default"
          ></CardDashboard>
          <CardDashboard
            Icon={Clock8}
            title="Pedidos pendientes"
            value={stats?.pending_orders ?? "0"}
            variant="warning"
          ></CardDashboard>
          <CardDashboard
            Icon={CircleCheckBig}
            title="Pedidos completados"
            value={stats?.completed_orders ?? "0"}
            variant="success"
          ></CardDashboard>
          <CardDashboard
            Icon={DollarSign}
            title="Total de ventas"
            value={stats?.total_revenue ? stats.total_revenue.toFixed(2) : "0.00"}
            variant="info"
          ></CardDashboard>
        </div>
        <SalesTable></SalesTable>
      </div>
    </div>
  );
}