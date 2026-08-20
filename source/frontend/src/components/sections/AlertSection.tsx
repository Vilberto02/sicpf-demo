import { useEffect } from "react";
import { Siren, Sparkles, TriangleAlert, Clock8  } from "lucide-react";
import { CardDashboard } from "../CardDashboard";
import { AlertsTable } from "../table/AlertsTable";
import { useAlertsStore } from "@/features/alerts/store";
import { AnimatedCounter } from "../AnimatedCounter";

export function AlertSection() {
  const { stats, fetchStats } = useAlertsStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-3 items-center text-3xl text-primary font-semibold tracking-tight">
          <Siren width={36} height={36}></Siren>
          <h3 className="mt-1">Alertas</h3>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          Próxima actualización del modelo: <span className="tabular-nums">02/11/2025, 00:00</span>
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-8">
        <div className="flex flex-col md:grid md:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
          <CardDashboard
            Icon={Sparkles}
            title="Tendencia de consumo"
            value={<AnimatedCounter value={stats?.consumption_trend ? parseFloat(stats.consumption_trend) : 0} suffix=" %" isFloat />}
            variant="success"
          ></CardDashboard>
          <CardDashboard
            Icon={Clock8}
            title="Productos con stock crítico"
            value={<AnimatedCounter value={stats?.critical_stock ?? 0} />}
            variant="warning"
          ></CardDashboard>
          <CardDashboard
            Icon={TriangleAlert}
            title="Productos en riesgo"
            value={<AnimatedCounter value={stats?.at_risk ?? 0} />}
            variant="danger"
          ></CardDashboard>
        </div>
        <AlertsTable></AlertsTable>
      </div>
    </div>
  );
}