import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getLoteCatalogo } from "@/features/inventory/api";
import type { ProductoType } from "@/features/products/types";
import type { LoteType } from "@/types/types";
import { formatDate } from "@/features/shared/dateUtils";

interface ProductDetailsModalProps {
  product: ProductoType | null;
  onClose: () => void;
}

const getLoteEstadoBadge = (estado: string) => {
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

export function ProductDetailsModal({ product, onClose }: ProductDetailsModalProps) {
  const [lotesProducto, setLotesProducto] = useState<LoteType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setLoading(true);
      getLoteCatalogo({ producto: product.id, page_size: 100 })
        .then((data) => setLotesProducto(data.results))
        .catch(() => setLotesProducto([]))
        .finally(() => setLoading(false));
    }
  }, [product]);

  return (
    <Dialog open={!!product} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl text-primary font-bold">
            {product?.nombre}
          </DialogTitle>
          {product && (
            <div className="flex gap-3 items-center text-sm text-muted-foreground">
              <span className="font-mono">{product.codigo}</span>
              <span>·</span>
              <span>{product.categoria_nombre}</span>
            </div>
          )}
        </DialogHeader>

        {product && (
          <div className="flex flex-col gap-6 py-2">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 p-4 rounded-xl ring-1 ring-black/5">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Precio Caja</p>
                <p className="font-medium text-sm mt-1">S/{Number(product.precio_real).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Precio Blíster</p>
                <p className="font-medium text-sm mt-1">S/{Number(product.precio_blister).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Precio Unidad</p>
                <p className="font-medium text-sm mt-1">S/{Number(product.precio_flotante).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Estado</p>
                <div className="mt-1">{getLoteEstadoBadge(product.estado)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Descripción</p>
                <p className="font-medium mt-1">{product.descripcion || "Sin descripción"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Presentaciones</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {product.presentacion_principal && (
                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs font-medium">Caja</span>
                  )}
                  {product.presentacion_blister && (
                    <span className="bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded-md text-xs font-medium">Blíster</span>
                  )}
                  {product.presentacion_unidad && (
                    <span className="bg-orange-500/10 text-orange-600 px-2 py-0.5 rounded-md text-xs font-medium">Unidad</span>
                  )}
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Contenido</p>
                <p className="font-medium mt-1">
                  {product.unidades_por_caja} und/caja · {product.blisters_por_caja} blísteres/caja ·{" "}
                  {product.unidades_por_blister} und/blíster
                </p>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-primary mb-3">Lotes del producto</h4>
              <div className="border rounded-md overflow-hidden ring-1 ring-black/5">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b">
                    <tr>
                      <th className="px-4 py-3 font-medium">Código</th>
                      <th className="px-4 py-3 font-medium">Tipo</th>
                      <th className="px-4 py-3 font-medium">Marca</th>
                      <th className="px-4 py-3 font-medium">Vencimiento</th>
                      <th className="px-4 py-3 font-medium text-right">Cajas</th>
                      <th className="px-4 py-3 font-medium text-right">Unid.</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                          Cargando lotes...
                        </td>
                      </tr>
                    ) : (
                      <>
                        {lotesProducto.map((lote) => (
                          <tr key={lote.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-3 font-medium">{lote.codigo_lote}</td>
                            <td className="px-4 py-3">
                              {lote.tipo_producto === "marca" ? (
                                <span className="text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  Marca
                                </span>
                              ) : (
                                <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                  Genérico
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">{lote.marca_nombre || "—"}</td>
                            <td className="px-4 py-3">{formatDate(lote.fecha_vencimiento)}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{lote.stock_real}</td>
                            <td className="px-4 py-3 text-right tabular-nums">{lote.stock_flotante}</td>
                            <td className="px-4 py-3">{getLoteEstadoBadge(lote.estado)}</td>
                          </tr>
                        ))}
                        {lotesProducto.length === 0 && (
                          <tr>
                            <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                              Este producto no tiene lotes registrados.
                            </td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
