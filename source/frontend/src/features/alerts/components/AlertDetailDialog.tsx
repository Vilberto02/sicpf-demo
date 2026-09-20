import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { AlertItemType, LoteAfectadoType } from "@/features/alerts/types";
import { NivelRiesgoBadge, OrigenBadge, EstadoBadge, TIPO_LABELS } from "./alertBadges";
import { formatDate } from "@/features/shared/dateUtils";

type AlertDetailDialogProps = {
  alerta: AlertItemType | null;
  onClose: () => void;
};

function formatDateSafe(value?: string | null) {
  if (!value) return "-";
  return formatDate(value);
}

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border bg-muted/40 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}

function LotesTable({ lotes }: { lotes: LoteAfectadoType[] }) {
  if (lotes.length === 0) return null;
  return (
    <div className="overflow-hidden rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Lote</th>
            <th className="px-3 py-2 text-left font-medium">Vencimiento</th>
            <th className="px-3 py-2 text-right font-medium">Días restantes</th>
            <th className="px-3 py-2 text-right font-medium">Stock (cajas)</th>
            <th className="px-3 py-2 text-right font-medium">Stock (unid.)</th>
          </tr>
        </thead>
        <tbody>
          {lotes.map((lote) => (
            <tr key={lote.id} className="border-t">
              <td className="px-3 py-2">{lote.codigo_lote}</td>
              <td className="px-3 py-2">{formatDateSafe(lote.fecha_vencimiento)}</td>
              <td className={`px-3 py-2 text-right ${lote.vencido ? "text-red-600 font-medium" : ""}`}>
                {lote.vencido ? "Vencido" : lote.dias_restantes}
              </td>
              <td className="px-3 py-2 text-right">{lote.stock_real}</td>
              <td className="px-3 py-2 text-right">{lote.stock_flotante}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AlertDetailDialog({ alerta, onClose }: AlertDetailDialogProps) {
  if (!alerta) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de alerta</DialogTitle>
          <DialogDescription>
            {alerta.producto_nombre}
            {alerta.producto_codigo ? ` (${alerta.producto_codigo})` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <NivelRiesgoBadge nivel={alerta.nivel_riesgo} />
          <OrigenBadge origen={alerta.origen} />
          <EstadoBadge estado={alerta.estado} />
          {alerta.tipo && (
            <span className="rounded-full border bg-muted px-2 py-1 text-xs font-medium">
              {TIPO_LABELS[alerta.tipo] ?? alerta.tipo}
            </span>
          )}
        </div>

        <hr className="border-border" />

        <section className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          <InfoRow label="Fecha de alerta">{formatDateSafe(alerta.fecha_alerta)}</InfoRow>
          <InfoRow label="Categoría">{alerta.categoria_nombre ?? "-"}</InfoRow>
          <InfoRow label="Stock mínimo (cajas)">{alerta.stock_minimo} cajas</InfoRow>
          <InfoRow label="Stock mínimo (unidades)">
            {alerta.stock_minimo_flotante ?? "-"} unidades
          </InfoRow>
          <InfoRow label="P. Agotamiento">{alerta.periodo_agotamiento} días</InfoRow>
          <InfoRow label="Tendencia de consumo">{alerta.tendencia_consumo ?? "-"}</InfoRow>
        </section>

        <hr className="border-border" />

        <section className="flex flex-col gap-3">
          <h4 className="text-sm font-semibold">¿Por qué se generó esta alerta?</h4>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {alerta.explicacion ?? "Sin explicación disponible para esta alerta."}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Metric label="Cajas" value={alerta.stock_actual_real ?? "-"} />
            <Metric label="Unid. sueltas" value={alerta.stock_actual_flotante ?? "-"} />
            <Metric label="Total unidades" value={alerta.total_unidades ?? "-"} />
            <Metric
              label="Venta prom./día"
              value={alerta.ventas_promedio_diario_30d ?? "-"}
            />
            <Metric label="Cobertura" value={`${alerta.dias_cobertura ?? "-"} d`} />
          </div>
        </section>

        {alerta.lotes_afectados && alerta.lotes_afectados.length > 0 && (
          <>
            <hr className="border-border" />
            <section className="flex flex-col gap-3">
              <h4 className="text-sm font-semibold">Lotes del producto</h4>
              <LotesTable lotes={alerta.lotes_afectados} />
            </section>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
