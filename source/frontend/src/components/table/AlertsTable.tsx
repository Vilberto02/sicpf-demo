import { useEffect } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import type { AlertItemType } from "@/features/alerts/types";
import { useAlertsStore } from "@/features/alerts/store";

export function AlertsTable() {
  const { items, fetchItems, loading } = useAlertsStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (loading) return <div>Cargando...</div>;

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
    },
    {
      accessorKey: "periodo_agotamiento",
      header: "P. Agotamiento",
      meta: { align: "right" },
    },
    {
      id: "category",
      accessorKey: "tendencia_consumo",
      header: "T. Consumo",
    },
    {
      id: "status",
      accessorKey: "nivel_riesgo",
      header: "N. Riesgo",
    },
  ];

  return (
    <DataTable
      columns={alertsColumns}
      data={items}
      searchPlaceholder="Buscar por producto"
      categories={["Alta", "Moderada", "Baja"]}
      statusHeaderProps="N. Riesgo"
    />
  );
}
