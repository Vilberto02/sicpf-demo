// pages/ProductosTable.tsx
import { useEffect } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/DataTable";
import type { InventoryItemType } from "@/features/inventory/types";
import { useInventoryStore } from "@/features/inventory/store";

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
    accessorKey: "stock_flotante",
    header: "S. Flotante",
  },
  {
    accessorKey: "stock_real",
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
  {
    accessorKey: "categoria",
    header: "Categoría",
  },
];

// Action handlers
const handleView = (row: InventoryItemType) => {
  console.log("View item:", row);
};

const handleEdit = (row: InventoryItemType) => {
  console.log("Edit item:", row);
};

const handleFinance = (row: InventoryItemType) => {
  console.log("Finance item:", row);
};

const handleBlock = (row: InventoryItemType) => {
  console.log("Block item:", row);
};

export default function InventoryTable() {
  const { items, fetchItems, loading } = useInventoryStore();

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (loading) return <div>Cargando...</div>;

  return (
    <DataTable
      columns={inventoryColumns}
      data={items}
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
