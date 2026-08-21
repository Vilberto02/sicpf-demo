import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { SaleItemType } from "@/features/sales/types";

interface SaleDetailsModalProps {
  sale: SaleItemType | null;
  onClose: () => void;
}

export function SaleDetailsModal({ sale, onClose }: SaleDetailsModalProps) {
  return (
    <Dialog open={!!sale} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary font-bold">
            Detalle de venta {sale?.codigo}
          </DialogTitle>
        </DialogHeader>
        
        {sale && (
          <div className="flex flex-col gap-6 py-4">
            {/* Información General */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-xl ring-1 ring-black/5">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Fecha</p>
                <p className="font-medium text-sm mt-1">
                  {new Intl.DateTimeFormat("es-ES", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(
                    new Date(sale.fecha)
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Cliente</p>
                <p className="font-medium text-sm mt-1">{sale.cliente_nombre}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Vendedor</p>
                <p className="font-medium text-sm mt-1">{sale.vendedor_nombre}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Estado</p>
                <span className={`px-2 py-1 inline-block mt-1 text-xs font-semibold rounded-md border text-sm ${
                  sale.estado === "Completado" ? "text-green-600 border-green-600/30 bg-green-50" :
                  sale.estado === "Pendiente" ? "text-yellow-600 border-yellow-600/30 bg-yellow-50" :
                  "text-red-600 border-red-600/30 bg-red-50"
                }`}>
                  {sale.estado}
                </span>
              </div>
            </div>

            {/* Items */}
            <div>
              <h4 className="text-lg font-semibold text-primary mb-3">Productos adquiridos</h4>
              <div className="border rounded-md overflow-hidden ring-1 ring-black/5">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">Producto</th>
                      <th className="px-4 py-3 font-medium">Lote</th>
                      <th className="px-4 py-3 font-medium text-center">Cant. / Tipo</th>
                      <th className="px-4 py-3 font-medium text-right">Precio Unit.</th>
                      <th className="px-4 py-3 font-medium text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {sale.detalles?.map((detalle: any) => {
                      // Determinar el tipo, cantidad y subtotal según lo que compró (Caja, Blister, Unidad)
                      const rows = [];
                      if (detalle.cantidad_real > 0) {
                        rows.push({
                          tipo: "Caja",
                          cant: detalle.cantidad_real,
                          precio: detalle.precio_real,
                          subtotal: detalle.cantidad_real * detalle.precio_real
                        });
                      }
                      if (detalle.cantidad_blister > 0) {
                        rows.push({
                          tipo: "Blíster",
                          cant: detalle.cantidad_blister,
                          precio: detalle.precio_blister,
                          subtotal: detalle.cantidad_blister * detalle.precio_blister
                        });
                      }
                      if (detalle.cantidad_flotante > 0) {
                        rows.push({
                          tipo: "Unidad",
                          cant: detalle.cantidad_flotante,
                          precio: detalle.precio_flotante,
                          subtotal: detalle.cantidad_flotante * detalle.precio_flotante
                        });
                      }

                      if (rows.length === 0) {
                         // Fail-safe si viene mal de BD
                         return (
                           <tr key={detalle.id} className="hover:bg-muted/30">
                             <td className="px-4 py-3 font-medium text-primary">{detalle.producto_nombre}</td>
                             <td className="px-4 py-3 text-muted-foreground text-xs">{detalle.lote_codigo}</td>
                             <td colSpan={3} className="px-4 py-3 text-center text-muted-foreground">Datos sin clasificar</td>
                           </tr>
                         )
                      }

                      return rows.map((r, i) => (
                        <tr key={`${detalle.id}-${r.tipo}`} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 font-medium text-primary">
                            {i === 0 ? detalle.producto_nombre : ""}
                          </td>
                          <td className="px-4 py-3 text-muted-foreground text-xs">
                            {i === 0 ? detalle.lote_codigo : ""}
                          </td>
                          <td className="px-4 py-3 text-center font-medium">
                            {r.cant} <span className="text-xs text-muted-foreground font-normal uppercase tracking-wider">{r.tipo}</span>
                          </td>
                          <td className="px-4 py-3 text-right">S/{Number(r.precio).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right font-medium">S/{Number(r.subtotal).toFixed(2)}</td>
                        </tr>
                      ));
                    })}
                    {(!sale.detalles || sale.detalles.length === 0) && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                          No hay productos registrados en esta venta.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totales */}
            <div className="flex justify-end pt-4">
              <div className="w-full md:w-1/2 flex justify-between items-center bg-primary/5 p-4 rounded-xl ring-1 ring-primary/20">
                <span className=" font-semibold text-primary">Total pago</span>
                <span className="text-2xl font-bold text-primary">S/{Number(sale.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
