import { useEffect, useState } from "react";
import { ChartPie, Package, Plus, Clock8, TriangleAlert } from "lucide-react";
import { Button } from "../ui/button";
import { CardDashboard } from "../CardDashboard";
import InventoryTable from "../table/InventoryTable";
import { useInventoryStore } from "@/features/inventory/store";
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
import { AnimatedCounter } from "../AnimatedCounter";

export function InventorySection() {
  const { stats, fetchStats } = useInventoryStore();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Producto agregado exitosamente al inventario.");
    setIsOpen(false);
  };

  return (
    <div className="flex flex-col gap-8 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-3 items-center text-3xl text-primary font-semibold tracking-tight">
          <Package width={36} height={36}></Package>
          <h3 className="mt-1">Inventario</h3>
        </div>

        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button className="cursor-pointer flex gap-2 items-center w-full md:w-auto shadow-sm">
              <Plus></Plus> Agregar Lote
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-2xl text-primary font-semibold tracking-tight">
                Registrar Nuevo Lote
              </SheetTitle>
              <SheetDescription>
                Añade un nuevo lote a un producto existente en el inventario.
              </SheetDescription>
            </SheetHeader>
            <form
              onSubmit={handleSave}
              className="flex flex-col gap-6 py-4 px-4"
            >
              <div className="flex flex-col gap-3">
                <Label htmlFor="productoId">ID o Nombre del Producto</Label>
                <Input id="productoId" placeholder="Ej. Buscar producto..." required />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="batch">Código de Lote</Label>
                <Input id="batch" placeholder="L-2024-XXX" required />
              </div>
              <div className="flex flex-col gap-3">
                <Label htmlFor="expiry">Fecha de Vencimiento</Label>
                <Input id="expiry" type="date" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <Label htmlFor="realStock">Stock Inicial (Cajas)</Label>
                  <Input
                    id="realStock"
                    type="number"
                    placeholder="0"
                    required
                    min="0"
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <Label htmlFor="floatStock">Stock Inicial (Unidades sueltas)</Label>
                  <Input
                    id="floatStock"
                    type="number"
                    placeholder="0"
                    required
                    min="0"
                  />
                </div>
              </div>
              <SheetFooter className="mt-4">
                <Button
                  type="submit"
                  className="w-full cursor-pointer shadow-sm"
                >
                  Guardar Lote
                </Button>
              </SheetFooter>
            </form>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex flex-col md:grid md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={ChartPie}
            title="Total de productos"
            value={<AnimatedCounter value={stats?.total_products ?? 0} />}
            variant="default"
          ></CardDashboard>
        </div>
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={TriangleAlert}
            title="Productos con bajo stock"
            value={<AnimatedCounter value={stats?.low_stock ?? 0} />}
            variant="danger"
          ></CardDashboard>
        </div>
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={Clock8}
            title="Próximos a vencer"
            value={<AnimatedCounter value={stats?.expiring_soon ?? 0} />}
            variant="warning"
          ></CardDashboard>
        </div>
      </div>
      <div className="w-full min-w-0">
        <InventoryTable></InventoryTable>
      </div>
    </div>
  );
}
