import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import type { AlertItemType } from "@/features/alerts/types";
import { useAlertsStore } from "@/features/alerts/store";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Eye } from "lucide-react";
import {
  NivelRiesgoBadge,
  OrigenBadge,
  EstadoBadge,
  TipoBadge,
} from "@/features/alerts/components/alertBadges";
import { AlertDetailDialog } from "@/features/alerts/components/AlertDetailDialog";

export function AlertsTable() {
  const { items, fetchItems, loading, markReviewed, markDiscarded } = useAlertsStore();
  const [selectedAlert, setSelectedAlert] = useState<AlertItemType | null>(null);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const alertsColumns: ColumnDef<AlertItemType>[] = [
    {
      accessorKey: "producto_nombre",
      header: "Producto",
    },
    {
      id: "tipo",
      accessorKey: "tipo",
      header: "Tipo",
      cell: ({ row }) => <TipoBadge tipo={row.original.tipo} />,
    },
    {
      accessorKey: "stock_minimo",
      header: "Stock Minimo",
      meta: { align: "right" },
      cell: ({ row }) =>
        `${row.original.stock_minimo} c / ${row.original.stock_minimo_flotante ?? 0} u`,
    },
    {
      accessorKey: "fecha_alerta",
      header: "Fecha",
      cell: ({ row }) => {
        const rawDate = row.getValue("fecha_alerta") as string;
        try {
          const date = new Date(rawDate);
          return new Intl.DateTimeFormat("es-ES", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }).format(date);
        } catch {
          return rawDate;
        }
      }
    },
    {
      accessorKey: "periodo_agotamiento",
      header: "P. Agotamiento",
      meta: { align: "right" },
      cell: ({ row }) => `${row.original.periodo_agotamiento} días`,
    },
    {
      id: "origen",
      accessorKey: "origen",
      header: "Origen",
      cell: ({ row }) => <OrigenBadge origen={row.original.origen} />,
    },
    {
      id: "estado",
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => <EstadoBadge estado={row.original.estado} />,
    },
    {
      id: "status",
      accessorKey: "nivel_riesgo",
      header: "N. Riesgo",
      cell: ({ row }) => <NivelRiesgoBadge nivel={row.original.nivel_riesgo} />,
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const alerta = row.original;
        const puedeGestionar = alerta.estado === "pendiente";
        return (
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="cursor-pointer"
              onClick={() => setSelectedAlert(alerta)}
              title="Ver detalle"
            >
              <Eye className="h-4 w-4 text-blue-600" />
            </Button>
            {puedeGestionar && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => markReviewed(alerta.id)}
                  title="Marcar como revisada"
                >
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => markDiscarded(alerta.id)}
                  title="Descartar"
                >
                  <XCircle className="h-4 w-4 text-red-600" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <DataTable
        columns={alertsColumns}
        data={items}
        searchPlaceholder="Buscar por producto"
        categories={["Alto", "Medio", "Bajo"]}
        statusHeaderProps="N. Riesgo"
        loading={loading}
      />
      <AlertDetailDialog alerta={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </>
  );
}
