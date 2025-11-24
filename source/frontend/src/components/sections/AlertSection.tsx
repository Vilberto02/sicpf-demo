import { Siren, Sparkles, TriangleAlert, Clock8  } from "lucide-react";
import { CardDashboard } from "../CardDashboard";
import { AlertsTable } from "../table/AlertsTable";

export function AlertSection() {
  return (
    <div>
      <div className="flex flex-col md:flex-row  md:items-center justify-between gap-4">
        <div className="flex gap-2 items-center text-3xl text-primary font-semibold">
          <Siren width={42} height={42}></Siren>
          <h3>Alertas</h3>
        </div>
        <p className="text-neutral-600">
          Próxima actualización del modelo: 02/11/2025, 00:00
        </p>
      </div>
      <div className="mt-6 flex flex-col gap-9">
        <div className="flex flex-col md:grid md:grid-cols-2 xl:grid-cols-3 gap-4 w-full">
          <CardDashboard
            Icon={Sparkles}
            title="Tendencia de consumo"
            value="12 %"
            variant="success"
          ></CardDashboard>
          <CardDashboard
            Icon={Clock8}
            title="Productos con stock crítico"
            value="6"
            variant="warning"
          ></CardDashboard>
          <CardDashboard
            Icon={TriangleAlert}
            title="Productos en riesgo"
            value="10"
            variant="danger"
          ></CardDashboard>
        </div>
        <AlertsTable></AlertsTable>
      </div>
    </div>
  );
}