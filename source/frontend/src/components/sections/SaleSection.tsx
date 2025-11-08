import { Plus, ShoppingCart, ShoppingBasket, Clock8, CircleCheckBig, DollarSign } from "lucide-react";
import { Button } from "../ui/button";
import { CardDashboard } from "../CardDashboard";

export function SaleSection() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2 items-center text-3xl text-primary font-semibold">
          <ShoppingCart width={42} height={42}></ShoppingCart>
          <h3>Ventas</h3>
        </div>
        <Button>
          <Plus></Plus> Agregar venta
        </Button>
      </div>
      <div className="mt-6 flex flex-col gap-9">
        <div className="flex gap-4 items-center w-full">
          <CardDashboard
            Icon={ShoppingBasket}
            title="Total de pedidos"
            value="150"
            variant="default"
          ></CardDashboard>
          <CardDashboard
            Icon={Clock8}
            title="Pedidos pendientes"
            value="45"
            variant="warning"
          ></CardDashboard>
          <CardDashboard
            Icon={CircleCheckBig}
            title="Pedidos completados"
            value="98"
            variant="success"
          ></CardDashboard>
          <CardDashboard
            Icon={DollarSign}
            title="Total de ventas"
            value="3,120.50"
            variant="info"
          ></CardDashboard>
        </div>
        <div className="mt-6">Holaaa</div>
      </div>
    </div>
  );
}