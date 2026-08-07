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
      accessorKey: "producto",
      header: "Producto",
    },
    {
      accessorKey: "categoria",
      header: "Categoria",
    },
    {
      accessorKey: "stock_actual",
      header: "Stock Actual",
    },
    {
      accessorKey: "stock_minimo",
      header: "Stock Minimo",
    },
    {
      accessorKey: "fecha",
      header: "Fecha",
    },

    {
      accessorKey: "periodo_agotamiento",
      header: "P. Agotamiento",
      meta: { align: "right" },
    },
    {
      accessorKey: "tendencia_consumo",
      header: "T. Consumo",
    },
  ];

  const handleView = (row: AlertItemType) => {
    console.log("View item:", row);
  };

  const handleEdit = (row: AlertItemType) => {
    console.log("Edit item:", row);
  };

  const handleBlock = (row: AlertItemType) => {
    console.log("Block item:", row);
  };

  return (
    <DataTable
      columns={alertsColumns}
      data={items}
      searchPlaceholder="Buscar por producto"
      categories={["Medicamentos", "Antihistamínicos", "Antibióticos"]}
      statusHeaderProps="N. Riesgo"
      onView={handleView}
      onEdit={handleEdit}
      onBlock={handleBlock}
    />
  );
}
