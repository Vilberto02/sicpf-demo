import { useEffect } from "react";
import { ChartPie, Package, Plus, Clock8, TriangleAlert } from "lucide-react";
import { Button } from "../ui/button";
import { CardDashboard } from "../CardDashboard";
import InventoryTable from "../table/InventoryTable";
import { useInventoryStore } from "@/features/inventory/store";

export function InventorySection() {
  const { stats, fetchStats } = useInventoryStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  return (
    <div>
      <div className="flex items-center justify-between gap-6">
        <div className="flex gap-2 items-center text-3xl text-primary font-semibold">
          <Package width={42} height={42}></Package>
          <h3>Inventario</h3>
        </div>
        <Button className="cursor-pointer flex gap-2 items-center">
          <Plus></Plus> Agregar producto
        </Button>
      </div>
      <div className="mt-6 flex flex-col gap-9">
        <div className="flex flex-col md:grid md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
          <CardDashboard
            Icon={ChartPie}
            title="Total de productos"
            value={stats?.total_products ?? "0"}
            variant="default"
          ></CardDashboard>
          <CardDashboard
            Icon={TriangleAlert}
            title="Productos con bajo stock"
            value={stats?.low_stock ?? "0"}
            variant="danger"
          ></CardDashboard>
          <CardDashboard
            Icon={Clock8}
            title="Próximos a vencer"
            value={stats?.expiring_soon ?? "0"}
            variant="warning"
          ></CardDashboard>
        </div>
        <div className="mt-6">
          <InventoryTable></InventoryTable>
        </div>
      </div>
    </div>
  );
}