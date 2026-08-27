import { useEffect } from "react";
import { Siren, TrendingDown, TriangleAlert, Clock8, Activity, Zap } from "lucide-react";
import { CardDashboard } from "../CardDashboard";
import { AlertsTable } from "../table/AlertsTable";
import { useAlertsStore } from "@/features/alerts/store";
import { AnimatedCounter } from "../AnimatedCounter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function AlertSection() {
  const { stats, fetchStats, generateAlerts, generating } = useAlertsStore();

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleGenerate = async () => {
    try {
      const result = await generateAlerts();
      toast.success(`Se generaron ${result.generadas} alertas`);
    } catch {
      toast.error("Error al generar alertas");
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-3 items-center text-3xl text-primary font-semibold tracking-tight">
          <Siren width={36} height={36}></Siren>
          <h3 className="mt-1">Alertas</h3>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-sm font-medium text-muted-foreground">
            Pendientes: <span className="tabular-nums font-bold text-primary">{stats?.total_pendientes ?? 0}</span>
          </p>
          <Button
            onClick={handleGenerate}
            disabled={generating}
            variant="default"
            size="sm"
            className="cursor-pointer"
          >
            <Zap className="mr-2 h-4 w-4" />
            {generating ? "Generando..." : "Generar Alertas"}
          </Button>
        </div>
      </div>
      <div className="mt-8 flex flex-col gap-8">
        <div className="flex flex-col md:grid md:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
          <CardDashboard
            Icon={TrendingDown}
            title="Quiebres estimados"
            value={<AnimatedCounter value={stats?.quiebres_estimados ?? 0} />}
            variant="danger"
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
          <CardDashboard
            Icon={Activity}
            title="Pendientes hoy"
            value={<AnimatedCounter value={stats?.generadas_hoy ?? 0} />}
            variant="info"
          ></CardDashboard>
        </div>
        <AlertsTable></AlertsTable>
      </div>
    </div>
  );
}