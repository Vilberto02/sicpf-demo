import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import type { SaleItemType } from "@/types";
import { salesData } from "@/mocks";

export function SalesTable() {

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleView = (row: any) => {
    console.log("View item:", row);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEdit = (row: any) => {
    console.log("Edit item:", row);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleFinance = (row: any) => {
    console.log("Finance item:", row);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleBlock = (row: any) => {
    console.log("Block item:", row);
  };

  return (
    <DataTable
      columns={salesColumns}
      data={salesData}
      searchPlaceholder="Buscar por cliente"
      categories={["Completado", "Pendiente", "Cancelado"]}
      statusHeaderProps="Estado"
      onView={handleView}
      onEdit={handleEdit}
      onFinance={handleFinance}
      onBlock={handleBlock}
    />
  )
}