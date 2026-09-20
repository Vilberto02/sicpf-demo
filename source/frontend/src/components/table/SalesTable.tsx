import { useEffect, useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "./DataTable";
import type { SaleItemType } from "@/features/sales/types";
import { useSalesStore } from "@/features/sales/store";
import { toast } from "sonner";
import { SaleDetailsModal } from "@/components/modals/SaleDetailsModal";
import { useAuthStore } from "@/features/auth/store";
import { getUsers } from "@/features/users/api";
import type { UsuarioItemType } from "@/features/users/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SaleStatusBadge } from "@/features/shared/badges";
import { formatDateTime } from "@/features/shared/dateUtils";
import { usePrintTicket } from "@/features/shared/hooks/usePrintTicket";
import { confirmAction } from "@/features/shared/confirmDialog";
import { getErrorMessage } from "@/features/shared/errorUtils";

const salesColumns: ColumnDef<SaleItemType>[] = [
  {
    accessorKey: "codigo",
    header: "Código",
  },
  {
    accessorKey: "cliente_nombre",
    header: "Cliente",
  },
  {
    accessorKey: "total",
    header: "Monto",
    cell: ({ row }) => `S/${Number(row.getValue("total")).toFixed(2)}`,
  },
  {
    accessorKey: "fecha",
    header: "Fecha y Hora",
    cell: ({ row }) => formatDateTime(row.getValue("fecha") as string),
  },
  {
    accessorKey: "vendedor_nombre",
    header: "Vendedor",
  },
  {
    id: "status",
    accessorKey: "estado",
    header: "Estado",
    cell: ({ row }) => <SaleStatusBadge estado={row.original.estado} />,
  }
];

export function SalesTable() {
  const {
    items, fetchItems, loading, updateItem, fetchStats,
    count, page, pageSize, setPage, search, setSearch,
    usuarioId, setUsuarioId, status, setStatus
  } = useSalesStore();
  const [selectedSale, setSelectedSale] = useState<SaleItemType | null>(null);
  
  const { userProfile } = useAuthStore();
  const isAdmin = userProfile?.role === "Administrador" || userProfile?.role === "Superusuario";
  const [vendedores, setVendedores] = useState<UsuarioItemType[]>([]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    if (isAdmin) {
      getUsers({ page_size: 100 }).then(data => {
        setVendedores(Array.isArray(data) ? data : data.results ?? []);
      }).catch(err => console.error(err));
    }
  }, [isAdmin]);

  // Action handlers
  const handleView = (row: SaleItemType) => {
    setSelectedSale(row);
  };

  const { printTicket } = usePrintTicket();

  const handleBlock = async (row: SaleItemType) => {
    if (row.estado === "Cancelado") {
      toast.error("Esta venta ya ha sido anulada");
      return;
    }

    const confirmed = await confirmAction({
      title: "¿Anular Venta?",
      text: `¿Estás seguro que deseas anular la venta ${row.codigo}? El stock de los productos será devuelto al inventario.`,
      confirmText: "Sí, anular",
    });

    if (confirmed) {
       try {
         await updateItem(row.id!, { estado: "Cancelado" });
         toast.success("Venta anulada y stock devuelto exitosamente");
         fetchItems();
         if (fetchStats) fetchStats();
       } catch(e) {
          toast.error("Hubo un error al anular la venta: " + (getErrorMessage(e) || "Error desconocido"));
       }
    }
  };

  return (
    <div className="space-y-4">
      <DataTable
        columns={salesColumns}
        data={items}
        searchPlaceholder="Buscar por cliente"
        categories={["Completado", "Pendiente", "Cancelado"]}
        categoryLabel="Estado"
        statusHeaderProps="Estado"
        onCategoryFilter={setStatus}
        selectedCategoryValue={status || "Todos"}
        searchValue={search}
        loading={loading}
        onView={handleView}
        onPrint={printTicket}
        onBlock={isAdmin ? handleBlock : undefined}
        serverSide
        totalCount={count}
        page={page - 1}
        pageSize={pageSize}
        onPageChange={(p) => setPage(p + 1)}
        onSearch={setSearch}
        customFilters={
          isAdmin && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                Vendedor:
              </span>
              <Select value={usuarioId || "Todos"} onValueChange={(val) => setUsuarioId(val === "Todos" ? null : val)}>
                <SelectTrigger className="w-52">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todos</SelectItem>
                  {vendedores.map((v) => (
                    <SelectItem key={v.id} value={v.id.toString()}>
                      {v.nombre} {v.apellido}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )
        }
      />

      <SaleDetailsModal sale={selectedSale} onClose={() => setSelectedSale(null)} />
    </div>
  );
}
