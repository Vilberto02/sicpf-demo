// pages/ProductosTable.tsx
import { useEffect, useMemo, useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/DataTable";
import type { InventoryItemType } from "@/features/inventory/types";
import { useInventoryStore } from "@/features/inventory/store";
import { LoteDetailsModal } from "../modals/LoteDetailsModal";
import { LoteSheet } from "../modals/LoteSheet";

export default function InventoryTable() {
  const { items, categories, fetchItems, fetchCategories, loading, fetchStats } = useInventoryStore();
  const [viewingLote, setViewingLote] = useState<InventoryItemType | null>(null);
  const [editingLote, setEditingLote] = useState<InventoryItemType | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, [fetchItems, fetchCategories]);

  const recentItemsFirst = useMemo(
    () =>
      [...items].sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      ),
    [items]
  );

  const getEstadoBadge = (estado: string) => {
    const styles: Record<string, string> = {
      vencido: "bg-red-100 text-red-800 border-red-200",
      "por vencer": "bg-yellow-100 text-yellow-800 border-yellow-200",
      activo: "bg-green-100 text-green-800 border-green-200",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[estado] || ""}`}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </span>
    );
  };

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
      cell: ({ row }) => {
        const rawDate = row.getValue("fecha_vencimiento") as string;
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
      id: "status",
      accessorKey: "estado",
      header: "Estado",
      cell: ({ row }) => getEstadoBadge(row.original.estado) 
    },
  ];

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
        data={recentItemsFirst}
        searchPlaceholder="Buscar por nombre o lote"
        categories={categories?.labels || []}
        statusHeaderProps="Estado"
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
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
