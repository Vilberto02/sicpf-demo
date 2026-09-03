import { useEffect, useState, useMemo } from "react";
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
import { formatDate } from "@/features/shared/dateUtils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function AlertsTable() {
  const {
    items, fetchItems, loading, markReviewed, markDiscarded,
    count, page, pageSize, setPage, setSearch,
    estado, setEstado, nivelRiesgo, setNivelRiesgo
  } = useAlertsStore();
  const [selectedAlert, setSelectedAlert] = useState<AlertItemType | null>(null);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const alertsColumns = useMemo<ColumnDef<AlertItemType>[]>(() => [
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
      cell: ({ row }) => formatDate(row.getValue("fecha_alerta") as string),
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
                  className="cursor-pointer text-green-600 hover:text-green-700 hover:bg-green-50"
                  onClick={() => markReviewed(alerta.id)}
                  title="Marcar como revisada"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => markDiscarded(alerta.id)}
                  title="Descartar"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        );
      },
    },
  ], [markReviewed, markDiscarded]);

  const customFilterControls = (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      {/* Filtro por Estado */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          Estado:
        </span>
        <Select
          value={estado || "Todos"}
          onValueChange={(val) => setEstado(val === "Todos" ? null : val)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="revisada">Revisada</SelectItem>
            <SelectItem value="descartada">Descartada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filtro por Nivel de Riesgo */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
          N. Riesgo:
        </span>
        <Select
          value={nivelRiesgo || "Todos"}
          onValueChange={(val) => setNivelRiesgo(val === "Todos" ? null : val)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Todos">Todos</SelectItem>
            <SelectItem value="alto">Alto</SelectItem>
            <SelectItem value="medio">Medio</SelectItem>
            <SelectItem value="bajo">Bajo</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <>
      <DataTable
        columns={alertsColumns}
        data={items}
        searchPlaceholder="Buscar por producto"
        statusHeaderProps="N. Riesgo"
        customFilters={customFilterControls}
        loading={loading}
        serverSide
        totalCount={count}
        page={page - 1}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p + 1)}
        onSearch={setSearch}
      />
      <AlertDetailDialog alerta={selectedAlert} onClose={() => setSelectedAlert(null)} />
    </>
  );
}
