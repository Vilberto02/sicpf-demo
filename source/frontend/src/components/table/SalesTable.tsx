import { useEffect } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import type { SaleItemType } from "@/features/sales/types";
import { useSalesStore } from "@/features/sales/store";

export function SalesTable() {
  const { items, fetchItems, loading } = useSalesStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (loading) return <div>Cargando...</div>;

  // Sales columns
  const salesColumns: ColumnDef<SaleItemType>[] = [
    {
      accessorKey: "codigo",
      header: "Código",
    },
    {
      accessorKey: "cliente",
      header: "Cliente",
    },
    {
      accessorKey: "monto",
      header: "Monto",
      cell: ({ row }) => `$${row.getValue("monto")}`,
    },
    {
      accessorKey: "fecha",
      header: "Fecha",
    },
    {
      accessorKey: "vendedor",
      header: "Vendedor",
    },
  ];

  // Action handlers
  const handleView = (row: SaleItemType) => {
    console.log("View item:", row);
  };

  const handleEdit = (row: SaleItemType) => {
    console.log("Edit item:", row);
  };

  const handleFinance = (row: SaleItemType) => {
    console.log("Finance item:", row);
  };

  const handleBlock = (row: SaleItemType) => {
    console.log("Block item:", row);
  };

  return (
    <DataTable
      columns={salesColumns}
      data={items}
      searchPlaceholder="Buscar por cliente"
      categories={["Completado", "Pendiente", "Cancelado"]}
      statusHeaderProps="Estado"
      onView={handleView}
      onEdit={handleEdit}
      onFinance={handleFinance}
      onBlock={handleBlock}
    />
  );
}
