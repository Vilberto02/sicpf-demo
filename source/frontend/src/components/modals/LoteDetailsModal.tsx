import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { LoteType } from "@/types/types";
import { formatDate } from "@/features/shared/dateUtils";

interface LoteDetailsModalProps {
  lote: LoteType | null;
  onClose: () => void;
}

const getEstadoBadge = (estado: string) => {
  const styles: Record<string, string> = {
    vencido: "text-red-600 border-red-600/30 bg-red-50",
    "por vencer": "text-yellow-600 border-yellow-600/30 bg-yellow-50",
    activo: "text-green-600 border-green-600/30 bg-green-50",
  };
  return (
    <span className={`px-2 py-0.5 rounded-md border text-xs font-medium ${styles[estado] || ""}`}>
      {estado.charAt(0).toUpperCase() + estado.slice(1)}
    </span>
  );
};

export function LoteDetailsModal({ lote, onClose }: LoteDetailsModalProps) {
  return (
    <Dialog open={!!lote} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary font-bold">
            Lote {lote?.codigo_lote}
          </DialogTitle>
          {lote && (
            <div className="flex gap-3 items-center text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{lote.producto_nombre}</span>
              <span>·</span>
              <span className="font-mono">{lote.producto_codigo}</span>
            </div>
          )}
        </DialogHeader>

        {lote && (
          <div className="flex flex-col gap-6 py-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-xl ring-1 ring-black/5">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Stock Cajas</p>
                <p className="font-medium text-sm mt-1 tabular-nums">{lote.stock_real}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Stock Unid.</p>
                <p className="font-medium text-sm mt-1 tabular-nums">{lote.stock_flotante}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Vencimiento</p>
                <p className="font-medium text-sm mt-1">{formatDate(lote.fecha_vencimiento)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Estado</p>
                <div className="mt-1">{getEstadoBadge(lote.estado)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Categoría</p>
                <p className="font-medium text-sm mt-1">{lote.categoria_nombre}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Presentación</p>
                <p className="font-medium text-sm mt-1 capitalize">{lote.presentacion_nombre}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Registrado</p>
                <p className="font-medium text-sm mt-1">{formatDate(lote.created_at ?? "")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Estado producto</p>
                <div className="mt-1">{getEstadoBadge(lote.producto_estado)}</div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-primary/5 p-4 rounded-xl ring-1 ring-primary/20 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Precio Caja</p>
                <p className="text-xl font-bold text-primary mt-1">S/{Number(lote.precio_real).toFixed(2)}</p>
              </div>
              <div className="bg-purple-500/5 p-4 rounded-xl ring-1 ring-purple-500/20 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Precio Blíster</p>
                <p className="text-xl font-bold text-purple-600 mt-1">S/{Number(lote.precio_blister).toFixed(2)}</p>
              </div>
              <div className="bg-orange-500/5 p-4 rounded-xl ring-1 ring-orange-500/20 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Precio Unidad</p>
                <p className="text-xl font-bold text-orange-600 mt-1">S/{Number(lote.precio_flotante).toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Presentaciones de venta</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {lote.presentacion_principal && (
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs font-medium">Caja / principal</span>
                  )}
                  {lote.presentacion_blister && (
                    <span className="bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-md text-xs font-medium">Blíster</span>
                  )}
                  {lote.presentacion_unidad && (
                    <span className="bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-md text-xs font-medium">Unidad</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Contenido</p>
                <p className="font-medium mt-1">
                  {lote.unidades_por_caja} und/caja · {lote.blisters_por_caja} blísteres/caja ·{" "}
                  {lote.unidades_por_blister} und/blíster
                </p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
