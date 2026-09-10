// pages/ProductosTable.tsx
import { useEffect, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/DataTable";
import type { InventoryItemType } from "@/features/inventory/types";
import { useInventoryStore } from "@/features/inventory/store";
import { useAuthStore } from "@/features/auth/store";
import { LoteDetailsModal } from "../modals/LoteDetailsModal";
import { LoteSheet } from "../modals/LoteSheet";
import { ProductStatusBadge } from "@/features/shared/badges";
import { formatDate } from "@/features/shared/dateUtils";

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
    cell: ({ row }) => formatDate(row.getValue("fecha_vencimiento") as string),
  },
  {
    id: "status",
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => <ProductStatusBadge estado={row.original.estado} />
  },
];

export default function InventoryTable() {
  const {
    items, categories, fetchItems, fetchCategories, loading, fetchStats,
    count, page, pageSize, setPage, setStatus
  } = useInventoryStore();
  const userProfile = useAuthStore((state) => state.userProfile);
  const isAdmin = userProfile?.role === "Administrador" || userProfile?.role === "Superusuario";

  const [viewingLote, setViewingLote] = useState<InventoryItemType | null>(null);
  const [editingLote, setEditingLote] = useState<InventoryItemType | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, [fetchItems, fetchCategories]);

  const handleView = (row: InventoryItemType) => {
    setViewingLote(row);
  };

  const handleEdit = (row: InventoryItemType) => {
    setEditingLote(row);
    setIsEditOpen(true);
  };

  return (
    <>
      <DataTable
        columns={inventoryColumns}
        data={items}
        searchPlaceholder="Buscar por nombre o lote"
        categories={categories?.labels || []}
        categoryLabel="Categoría"
        statusHeaderProps="Estado"
        onCategoryFilter={setStatus}
        loading={loading}
        onView={handleView}
        onEdit={isAdmin ? handleEdit : undefined}
        serverSide
        totalCount={count}
        page={page - 1}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p + 1)}
        onSearch={(search) => useInventoryStore.getState().setSearch(search)}
      />

      <LoteDetailsModal
        lote={viewingLote}
        onClose={() => setViewingLote(null)}
      />

      <LoteSheet
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        lote={editingLote}
        onSaved={() => fetchStats()}
      />
    </>
  );
}
