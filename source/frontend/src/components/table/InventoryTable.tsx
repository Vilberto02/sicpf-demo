// pages/ProductosTable.tsx
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/DataTable";
import type { InventoryItemType } from "@/types";
import { inventoryData } from "@/mocks";

// Inventory columns
const inventoryColumns: ColumnDef<InventoryItemType>[] = [
  {
    accessorKey: "codigo",
    header: "Código",
  },
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    accessorKey: "stockFlotante",
    header: "S. Flotante",
  },
  {
    accessorKey: "stockReal",
    header: "S. Real",
  },
  {
    accessorKey: "lote",
    header: "Lote",
  },
  {
    accessorKey: "vencimiento",
    header: "Vencimiento",
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

export default function InventoryTable() {
  return (
    <DataTable
      columns={inventoryColumns}
      data={inventoryData}
      searchPlaceholder="Buscar por nombre"
      categories={["Medicamentos", "Antibióticos", "Antihistamínicos"]}
      statusHeaderProps="Estado"
      onView={handleView}
      onEdit={handleEdit}
      onFinance={handleFinance}
      onBlock={handleBlock}
    />
  );
}
