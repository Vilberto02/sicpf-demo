import { useEffect } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import type { AlertItemType } from "@/features/alerts/types";
import { useAlertsStore } from "@/features/alerts/store";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";

export function AlertsTable() {
  const { items, fetchItems, loading, markReviewed, markDiscarded } = useAlertsStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (loading) return <div>Cargando...</div>;

  const getNivelRiesgoBadge = (nivel: string) => {
    const styles: Record<string, string> = {
      alto: "bg-red-100 text-red-800 border-red-200",
      medio: "bg-yellow-100 text-yellow-800 border-yellow-200",
      bajo: "bg-green-100 text-green-800 border-green-200",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[nivel] || ""}`}>
        {nivel.charAt(0).toUpperCase() + nivel.slice(1)}
      </span>
    );
  };

  const getOrigenBadge = (origen: string) => {
    const styles: Record<string, string> = {
      reglas: "bg-blue-100 text-blue-800 border-blue-200",
      ml: "bg-purple-100 text-purple-800 border-purple-200",
      manual: "bg-gray-100 text-gray-800 border-gray-200",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[origen] || ""}`}>
        {origen.charAt(0).toUpperCase() + origen.slice(1)}
      </span>
    );
  };

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      pendiente: "bg-orange-100 text-orange-800 border-orange-200",
      revisada: "bg-green-100 text-green-800 border-green-200",
      descartada: "bg-gray-100 text-gray-500 border-gray-200",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[estado] || ""}`}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

  const alertsColumns: ColumnDef<AlertItemType>[] = [
    {
      accessorKey: "producto_nombre",
      header: "Producto",
    },
    {
      accessorKey: "categoria_nombre",
      header: "Categoria",
    },
    {
      accessorKey: "stock_minimo",
      header: "Stock Minimo",
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
    },
    {
      id: "origen",
      accessorKey: "origen",
      header: "Origen",
      cell: ({ row }) => getOrigenBadge(row.original.origen),
    },
    {
      id: "estado",
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => getEstadoBadge(row.original.estado),
    },
    {
      id: "status",
      accessorKey: "nivel_riesgo",
      header: "N. Riesgo",
      cell: ({ row }) => getNivelRiesgoBadge(row.original.nivel_riesgo),
    },
    {
      id: "acciones",
      header: "Acciones",
      cell: ({ row }) => {
        const alerta = row.original;
        if (alerta.estado !== "pendiente") return null;
        return (
          <div className="flex gap-1">
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
          </div>
        );
      },
    },
  ];

  return (
    <DataTable
      columns={alertsColumns}
      data={items}
      searchPlaceholder="Buscar por producto"
      categories={["Alto", "Medio", "Bajo"]}
      statusHeaderProps="N. Riesgo"
    />
  );
}
