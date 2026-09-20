import { useEffect } from "react";
import { Boxes, Coins, Package, Plus, Clock8, TriangleAlert } from "lucide-react";
import { CardDashboard } from "../CardDashboard";
import InventoryTable from "../table/InventoryTable";
import { useInventoryStore } from "@/features/inventory/store";
import { useAuthStore } from "@/features/auth/store";
import { Button } from "@/components/ui/button";
import { AnimatedCounter } from "../AnimatedCounter";
import { LoteSheet } from "../modals/LoteSheet";

export function InventorySection() {
  const { stats, fetchStats } = useInventoryStore();
  const userProfile = useAuthStore((s) => s.userProfile);
  const isAdmin = userProfile?.role === "Administrador" || userProfile?.role === "Superusuario";

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="flex flex-col gap-8 min-w-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-3 items-center text-3xl text-primary font-semibold tracking-tight">
          <Package width={36} height={36}></Package>
          <h3 className="mt-1">Lotes</h3>
        </div>

        {isAdmin && (
          <div className="flex gap-4">
            <LoteSheet
              onSaved={fetchStats}
            >
              <Button className="cursor-pointer flex gap-2 items-center w-full md:w-auto shadow-sm">
                <Plus></Plus> Agregar lote
              </Button>
            </LoteSheet>
          </div>
        )}
      </div>

      <div className="flex flex-col md:grid md:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={Boxes}
            title="Total de lotes"
            value={<AnimatedCounter value={stats?.total_lotes ?? 0} />}
            variant="default"
          ></CardDashboard>
        </div>
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={Coins}
            title="Valorización del inventario"
            value={
              <span className="text-3xl">
                S/ <AnimatedCounter value={stats?.inventory_value ?? 0} isFloat />
              </span>
            }
            variant="info"
          ></CardDashboard>
        </div>
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={TriangleAlert}
            title="Lotes con bajo stock"
            value={<AnimatedCounter value={stats?.low_stock ?? 0} />}
            variant="danger"
          ></CardDashboard>
        </div>
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={Clock8}
            title="Lotes próximos a vencer"
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
