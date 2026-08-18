// pages/ProductosTable.tsx
import { useEffect } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/DataTable";
import type { InventoryItemType } from "@/features/inventory/types";
import { useInventoryStore } from "@/features/inventory/store";

export default function InventoryTable() {
  const { items, categories, fetchItems, fetchCategories, loading } = useInventoryStore();

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, [fetchItems, fetchCategories]);

  if (loading) return <div>Cargando...</div>;

  const inventoryColumns: ColumnDef<InventoryItemType>[] = [
    {
      accessorKey: "producto_nombre",
      header: "Nombre del Producto",
    },
    {
      accessorKey: "codigo_lote",
      header: "Código Lote",
    },
    {
      id: "category",
      accessorKey: "categoria_nombre",
      header: "Categoría",
    },
    {
      accessorKey: "stock_real",
      header: "Stock Cajas",
      meta: { align: "right" },
      cell: ({ row }) => row.getValue("stock_real") ?? 0,
    },
    {
      accessorKey: "stock_flotante",
      header: "Stock Unidades",
      meta: { align: "right" },
      cell: ({ row }) => row.getValue("stock_flotante") ?? 0,
    },
    {
      accessorKey: "precio_real",
      header: "Precio Caja",
      meta: { align: "right" },
      cell: ({ row }) => {
        const rawValue = row.getValue("precio_real");
        const value = rawValue ? parseFloat(rawValue as string) : 0;
        return new Intl.NumberFormat("es-PE", {
          style: "currency",
          currency: "PEN",
        }).format(value || 0);
      },
    },
    {
      accessorKey: "precio_flotante",
      header: "Precio Unidad",
      meta: { align: "right" },
      cell: ({ row }) => {
        const rawValue = row.getValue("precio_flotante");
        const value = rawValue ? parseFloat(rawValue as string) : 0;
        return new Intl.NumberFormat("es-PE", {
          style: "currency",
          currency: "PEN",
        }).format(value || 0);
      },
    },
    {
      accessorKey: "fecha_vencimiento",
      header: "Vencimiento",
    },
    {
      id: "status",
      accessorKey: "producto_estado",
      header: "Estado",
    },
  ];

  const handleView = (row: InventoryItemType) => {
    console.log("View item:", row);
  };

  const handleEdit = (row: InventoryItemType) => {
    console.log("Edit item:", row);
  };

  return (
    <DataTable
      columns={inventoryColumns}
      data={items}
      searchPlaceholder="Buscar por nombre o lote"
      categories={categories?.labels || []}
      statusHeaderProps="Estado"
      onView={handleView}
      onEdit={handleEdit}
    />
  );
}
