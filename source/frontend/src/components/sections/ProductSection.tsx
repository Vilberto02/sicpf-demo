import { useEffect, useState } from "react";
import { Package, ArrowLeft, Plus } from "lucide-react";
import { toast } from "sonner";
import { type ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/table/DataTable";
import { CardDashboard } from "../CardDashboard";
import { AnimatedCounter } from "../AnimatedCounter";
import { Button } from "@/components/ui/button";
import { NewProductDialog } from "@/components/modals/NewProductDialog";
import { ProductDetailsModal } from "@/components/modals/ProductDetailsModal";
import { useProductStore } from "@/features/products/store";
import type { ProductoType } from "@/features/products/types";

export function ProductSection({ onBack }: { onBack?: () => void }) {
  const { products, stats, fetchProducts, fetchStats, removeProduct } = useProductStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductoType | null>(null);
  const [viewingProduct, setViewingProduct] = useState<ProductoType | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchStats();
  }, [fetchProducts, fetchStats]);

  const recentProductsFirst = [...products].sort(
    (a, b) =>
      new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
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

  const handleDelete = async (row: ProductoType) => {
    const { default: Swal } = await import("sweetalert2");

    const result = await Swal.fire({
      title: "¿Eliminar producto?",
      text: `Se eliminará "${row.nombre}" junto con todos sus lotes. Esta acción no se puede deshacer.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
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
      cell: ({ row }) => getEstadoBadge(row.original.estado),
    },
  ];

  const categories = Array.from(
    new Set(products.map((p) => p.categoria_nombre).filter(Boolean))
  ) as string[];

  return (
    <div className="flex flex-col gap-8 min-w-0 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-4 items-center">
          {onBack && (
            <Button className="cursor-pointer" variant="outline" size="icon" onClick={onBack}>
              <ArrowLeft size={18} />
            </Button>
          )}
          <div className="flex gap-3 items-center text-3xl text-primary font-semibold tracking-tight">
            <Package width={36} height={36}></Package>
            <h3 className="mt-1">Productos</h3>
          </div>
        </div>

        <Button
          className="cursor-pointer flex gap-2 items-center w-full md:w-auto shadow-sm"
          onClick={openCreateDialog}
        >
          <Plus></Plus> Agregar producto
        </Button>
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
          data={recentProductsFirst}
          searchPlaceholder="Buscar por código o nombre"
          categories={categories}
          statusHeaderProps="Estado"
          onView={setViewingProduct}
          onEdit={openEditDialog}
          onDelete={handleDelete}
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
