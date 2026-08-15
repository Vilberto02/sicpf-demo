// pages/ProductosTable.tsx
import { useEffect } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/DataTable";
import type { InventoryItemType } from "@/features/inventory/types";
import { useInventoryStore } from "@/features/inventory/store";

// Inventory columns
const inventoryColumns: ColumnDef<InventoryItemType>[] = [
  {
    accessorKey: "producto_codigo",
    header: "Código",
  },
  {
    accessorKey: "producto_nombre",
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
    accessorKey: "codigo_lote",
    header: "Lote",
  },
  {
    accessorKey: "fecha_vencimiento",
    header: "Vencimiento",
  },
  {
    accessorKey: "categoria_nombre",
    header: "Categoría",
  },
  {
    id: "status",
    accessorKey: "producto_estado",
    header: "Estado",
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
