import { useEffect, useState } from "react";
import { Package, Plus, Package2 } from "lucide-react";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/DataTable";
import { CardDashboard } from "../CardDashboard";
import { AnimatedCounter } from "../AnimatedCounter";
import { Button } from "@/components/ui/button";
import { NewProductDialog } from "@/components/modals/NewProductDialog";
import { ProductDetailsModal } from "@/components/modals/ProductDetailsModal";
import { useProductStore } from "@/features/products/store";
import { useInventoryStore } from "@/features/inventory/store";
import { useAuthStore } from "@/features/auth/store";
import type { ProductoType } from "@/features/products/types";
import { ProductStatusBadge } from "@/features/shared/badges";
import { confirmAction } from "@/features/shared/confirmDialog";

const productColumns: ColumnDef<ProductoType>[] = [
  {
    accessorKey: "codigo",
    header: "Código",
  },
  {
    accessorKey: "nombre",
    header: "Nombre",
  },
  {
    id: "category",
    accessorKey: "categoria_nombre",
    header: "Categoría",
  },
  {
    accessorKey: "precio_real",
    header: "Precio Caja",
    meta: { align: "right" },
    cell: ({ row }) =>
      new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
        Number(row.getValue("precio_real")) || 0
      ),
  },
  {
    accessorKey: "precio_flotante",
    header: "Precio Unidad",
    meta: { align: "right" },
    cell: ({ row }) =>
      new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
        Number(row.getValue("precio_flotante")) || 0
      ),
  },
  {
    id: "presentacion",
    accessorKey: "presentacion_nombre",
    header: "Presentación",
    cell: ({ row }) => row.original.presentacion_nombre || "—",
  },
  {
    id: "status",
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => <ProductStatusBadge estado={row.original.estado} />,
  },
];

export function ProductSection() {
  const {
    products, stats, count, page, pageSize,
    fetchProducts, fetchStats, removeProduct, loading,
    setPage, setSearch, setCategory
  } = useProductStore();
  const userProfile = useAuthStore((s) => s.userProfile);
  const isAdmin = userProfile?.role === "Administrador" || userProfile?.role === "Superusuario";

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductoType | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ProductoType | null>(null);

  const { categories: inventoryCategories, fetchCategories } = useInventoryStore();

  useEffect(() => {
    fetchProducts();
    fetchStats();
    fetchCategories();
  }, [fetchProducts, fetchStats, fetchCategories]);

  const handleDelete = async (row: ProductoType) => {
    const confirmed = await confirmAction({
      title: "¿Eliminar producto?",
      text: `Se eliminará "${row.nombre}" junto con todos sus lotes. Esta acción no se puede deshacer.`,
    });

    if (confirmed) {
      const ok = await removeProduct(row.id);
      if (ok) {
        toast.success("Producto eliminado exitosamente");
        fetchStats();
      } else {
        toast.error("No se pudo eliminar el producto");
      }
    }
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (row: ProductoType) => {
    setEditingProduct(row);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 min-w-0 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-4 items-center">
          <div className="flex gap-3 items-center text-3xl text-primary font-semibold tracking-tight">
            <Package2 width={36} height={36}></Package2>
            <h3 className="mt-1">Productos</h3>
          </div>
        </div>

        {isAdmin && (
          <Button
            className="cursor-pointer flex gap-2 items-center w-full md:w-auto shadow-sm"
            onClick={openCreateDialog}
          >
            <Plus></Plus> Agregar producto
          </Button>
        )}
      </div>

      <div className="flex flex-col md:grid md:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={Package}
            title="Total de productos"
            value={<AnimatedCounter value={stats?.total ?? 0} />}
            variant="default"
          ></CardDashboard>
        </div>
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={Package}
            title="Productos activos"
            value={<AnimatedCounter value={stats?.activos ?? 0} />}
            variant="success"
          ></CardDashboard>
        </div>
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={Package}
            title="Por vencer"
            value={<AnimatedCounter value={stats?.por_vencer ?? 0} />}
            variant="warning"
          ></CardDashboard>
        </div>
        <div className="bg-card shadow-sm ring-1 ring-black/5 rounded-xl w-full min-w-0">
          <CardDashboard
            Icon={Package}
            title="Vencidos"
            value={<AnimatedCounter value={stats?.vencidos ?? 0} />}
            variant="danger"
          ></CardDashboard>
        </div>
      </div>

      <div className="w-full min-w-0">
        <DataTable
          columns={productColumns}
          data={products}
          searchPlaceholder="Buscar por código o nombre"
          categories={inventoryCategories?.labels || []}
          categoryLabel="Categoría"
          onCategoryFilter={setCategory}
          statusHeaderProps="Estado"
          loading={loading}
          onView={setViewingProduct}
          onEdit={isAdmin ? openEditDialog : undefined}
          onDelete={isAdmin ? handleDelete : undefined}
          serverSide
          totalCount={count}
          page={page - 1}
          pageSize={pageSize}
          onPageChange={(p) => setPage(p + 1)}
          onSearch={setSearch}
        />
      </div>

      <NewProductDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={editingProduct}
        onSaved={() => fetchStats()}
      />

      <ProductDetailsModal
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
      />
    </div>
  );
}
