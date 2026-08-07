import { useEffect, useState } from "react";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export function SaleSection() {
  const { stats, fetchStats } = useSalesStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Venta registrada exitosamente.");
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-8 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-3 items-center text-3xl text-primary font-semibold tracking-tight">
          <ShoppingCart width={36} height={36}></ShoppingCart>
          <h3 className="mt-1">Ventas</h3>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button className="cursor-pointer flex gap-2 items-center w-full md:w-auto shadow-sm">
              <Plus></Plus> Agregar venta
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-2xl text-primary font-semibold tracking-tight">
                Nueva Venta
              </SheetTitle>
              <SheetDescription>
                Registra una transacción. Los productos seleccionados
                descontarán del inventario.
              </SheetDescription>
            </SheetHeader>
            <form
              onSubmit={handleSave}
              className="flex flex-col gap-6 py-4 px-4"
            >
              <div className="flex flex-col gap-3">
                <Label htmlFor="client">Cliente</Label>
                <Input
                  id="client"
                  placeholder="Consumidor Final"
                  defaultValue="Consumidor Final"
                  required
                />
              </div>
              <div className="flex flex-col gap-3">
                <Label>Buscador de Producto</Label>
                <Select>
                  <SelectTrigger className="w-full cursor-pointer">
                    <SelectValue placeholder="Busque un producto..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="p1">
                      Paracetamol 500mg - S/ 2.50
                    </SelectItem>
                    <SelectItem value="p2">
                      Ibuprofeno 400mg - S/ 3.00
                    </SelectItem>
                    <SelectItem value="p3">
                      Amoxicilina 500mg - S/ 5.50
                    </SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-xs text-muted-foreground italic">
                  Este es un selector Mock para validar la interfaz visual.
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="qty">Cantidad</Label>
                  <Input
                    id="qty"
                    type="number"
                    placeholder="1"
                    required
                    min="1"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="price">Monto Total</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="pl-7"
                      required
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <SheetFooter className="mt-4">
                <Button
                  type="submit"
                  className="w-full cursor-pointer shadow-sm"
                >
                  Confirmar Venta
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-col sm:grid sm:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={ShoppingBasket}
            title="Total de pedidos"
            value={stats?.total_orders ?? "0"}
            variant="default"
          ></CardDashboard>
        </div>
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={Clock8}
            title="Pedidos pendientes"
            value={stats?.pending_orders ?? "0"}
            variant="warning"
          ></CardDashboard>
        </div>
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={CircleCheckBig}
            title="Pedidos completados"
            value={stats?.completed_orders ?? "0"}
            variant="success"
          ></CardDashboard>
        </div>
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={DollarSign}
            title="Total de ventas"
            value={
              stats?.total_revenue ? stats.total_revenue.toFixed(2) : "0.00"
            }
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
