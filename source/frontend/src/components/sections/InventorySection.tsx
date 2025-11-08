import { ChartPie, Package, Plus, Clock8, TriangleAlert } from "lucide-react";
import { Button } from "../ui/button";
import { CardDashboard } from "../CardDashboard";
import InventoryTable from "../table/InventoryTable";

export function InventorySection() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center text-3xl text-primary font-semibold">
          <Package width={42} height={42}></Package>
          <h3>Inventario</h3>
        </div>
        <Button>
          <Plus></Plus> Agregar producto
        </Button>
      </div>
      <div className="mt-6 flex flex-col gap-9">
        <div className="flex gap-4 items-center w-full">
          <CardDashboard
            Icon={ChartPie}
            title="Total de productos"
            value="156"
            variant="default"
          ></CardDashboard>
          <CardDashboard
            Icon={TriangleAlert}
            title="Productos con bajo stock"
            value="15"
            variant="danger"
          ></CardDashboard>
          <CardDashboard
            Icon={Clock8}
            title="Próximos a vencer"
            value="8"
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