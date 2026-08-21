import {
  useReactTable,
  type ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { useState, useMemo } from "react";
import {
  ListFilter,
  Eye,
  Edit,
  DollarSign,
  Ban,
  ChevronLeft,
  ChevronRight,
  Printer,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Button } from "@/components/ui/button";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  categories?: string[];
  statusHeaderProps: string;
  onView?: (row: TData) => void;
  onEdit?: (row: TData) => void;
  onFinance?: (row: TData) => void;
  onBlock?: (row: TData) => void;
  onPrint?: (row: TData) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Buscar...",
  categories = [],
  statusHeaderProps = "Estado",
  onView,
  onEdit,
  onFinance,
  onBlock,
  onPrint,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [itemsPerPage] = useState(10);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: itemsPerPage,
  });

  const handleSearch = (value: string) => {
    setGlobalFilter(value);
  };


  const StatusBadge = ({ status }: { status: string }) => {
    const statusStyles = {
      success: "text-green-500 border-green-500",
      warning: "text-warning border-warning",
      danger: "text-red-500 border-red-500",
    };

    const getStateText = (state: string) => {
      if (["Activo", "Completado", "Bajo"].includes(state)) {
        return statusStyles.success;
      } else if (["Por vencer", "Pendiente", "Medio"].includes(state)) {
        return statusStyles.warning;
      } else if (["Vencido", "Cancelado", "Alto"].includes(state)) {
        return statusStyles.danger;
      } else {
        return "text-stone-600 border-stone-600";
      }
    };

    return (
      <span
        className={`px-2 py-1 line-clamp-1 sm:line-clamp-0 rounded-md text-xs text-center font-medium border ${getStateText(status) || "border-gray-500 text-gray-500"}`}
      >
        {status}
      </span>
    );
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ActionIcons = ({ row }: { row: TData }) => (
    <div className="flex items-center gap-2">
      {onView && (
        <Button
          onClick={() => onView(row)}
          variant="ghost"
          className="p-1 text-primary hover:text-primary/60 transition-colors cursor-pointer"
          title="Ver detalle"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )}
      {onEdit && (
        <Button
          onClick={() => onEdit(row)}
          variant="ghost"
          className="p-1 text-blue-600 hover:text-blue-400 transition-colors cursor-pointer"
          title="Editar"
        >
          <Edit className="h-4 w-4" />
        </Button>
      )}
      {onFinance && (
        <Button
          onClick={() => onFinance(row)}
          variant="ghost"
          className="p-1 text-yellow-500 hover:text-yellow-400 transition-colors cursor-pointer"
        >
          <DollarSign className="h-4 w-4" />
        </Button>
      )}
      {onPrint && (
        <Button
          onClick={() => onPrint(row)}
          variant="ghost"
          className="p-1 text-stone-600 hover:text-stone-400 transition-colors cursor-pointer"
          title="Imprimir"
        >
          <Printer className="h-4 w-4" />
        </Button>
      )}
      {onBlock && (
        <Button
          onClick={() => onBlock(row)}
          variant="ghost"
          className="p-1 text-red-600 hover:text-red-400 transition-colors cursor-pointer"
          title="Anular"
        >
          <Ban className="h-4 w-4" />
        </Button>
      )}
    </div>
  );

  const enhancedColumns = useMemo(() => {
    return [
      ...columns,
      ...(columns.some(col => col.id === "status" || ('accessorKey' in col && col.accessorKey === "status")) ? [] : [{
        id: "status",
        header: statusHeaderProps,
        accessorFn: (row: any) => row.status || "Activo",
        cell: ({ row }: { row: { original: TData } }) => {
          const status = (row.original as { status?: string }).status || "Activo";
          return <StatusBadge status={status} />;
        },
      }]),
      ...((onView || onEdit || onFinance || onBlock || onPrint)
        ? [
            {
              id: "actions",
              header: "Acciones",
              cell: ({ row }: { row: { original: TData } }) => (
                <ActionIcons row={row.original} />
              ),
            },
          ]
        : []),
    ];
  }, [ActionIcons, columns, statusHeaderProps, onView, onEdit, onFinance, onBlock, onPrint]);

  const enhancedTable = useReactTable({
    data,
    columns: enhancedColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    state: {
      columnFilters,
      globalFilter,
      pagination,
    },
  });

  const handleFilterClick = () => {
    const col = enhancedTable.getColumn("categoria") || enhancedTable.getColumn("category") || enhancedTable.getColumn("status");
    if (!col) {
      console.warn("No filterable column found");
      return;
    }
    if (selectedCategory === "Todos" || selectedCategory === "Todas las categorias") {
      col.setFilterValue("");
    } else {
      col.setFilterValue(selectedCategory);
    }
  };

  return (
    <div className="w-full rounded-xl bg-card shadow-sm ring-1 ring-black/5 overflow-hidden">
      {/* Barra superior */}
      <div className="flex flex-col gap-4 lg:flex lg:flex-row lg:items-center lg:justify-between p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Buscador */}
          <Input
            type="search"
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(e) => handleSearch(e.currentTarget.value)}
            className="min-w-72"
          ></Input>

          {/* Selector */}
          {categories.length > 0 && (
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Botón de filtro */}
        <Button className="cursor-pointer" onClick={handleFilterClick}>
          <ListFilter className="h-4 w-4" />
          Filtrar
        </Button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full">
          <thead>
            {enhancedTable.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-border">
                {headerGroup.headers.map((header) => {
                  const align = (header.column.columnDef.meta as any)?.align || "left";
                  return (
                  <th
                    key={header.id}
                    className={`py-3 px-4 text-sm font-medium bg-muted/30 text-${align}`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {enhancedTable.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={enhancedColumns.length} className="py-12 text-center text-muted-foreground bg-muted/10 font-medium">
                  Aún no hay registros para mostrar.
                </td>
              </tr>
            ) : (
              enhancedTable.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-border hover:bg-muted/50 transition-colors"
                >
                  {row.getVisibleCells().map((cell) => {
                    const align = (cell.column.columnDef.meta as any)?.align || "left";
                    return (
                    <td key={cell.id} className={`py-3 px-4 text-sm tabular-nums text-${align}`}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between p-4 ">
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-600">
            Mostrando {enhancedTable.getState().pagination.pageIndex * enhancedTable.getState().pagination.pageSize + 1} a {Math.min((enhancedTable.getState().pagination.pageIndex + 1) * enhancedTable.getState().pagination.pageSize, enhancedTable.getFilteredRowModel().rows.length)} de {enhancedTable.getFilteredRowModel().rows.length} resultados
          </span>
        </div>

        {/* Navegación de páginas */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => enhancedTable.previousPage()}
            disabled={!enhancedTable.getCanPreviousPage()}
            className="p-1 text-stone-500 hover:text-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1">
            {Array.from(
              { length: Math.min(5, enhancedTable.getPageCount()) },
              (_, i) => {
                const pageIndex = i;
                const isActive = enhancedTable.getState().pagination.pageIndex === pageIndex;
                return (
                  <button
                    key={pageIndex}
                    onClick={() => enhancedTable.setPageIndex(pageIndex)}
                    className={`min-w-[32px] h-8 flex items-center justify-center rounded-md text-sm transition-colors px-2 cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "text-muted-foreground hover:bg-muted font-medium"
                    }`}
                  >
                    {pageIndex + 1}
                  </button>
                );
              }
            )}
            {enhancedTable.getPageCount() > 5 && (
              <>
                <span className="text-stone-500 px-1">...</span>
                <button
                  onClick={() =>
                    enhancedTable.setPageIndex(enhancedTable.getPageCount() - 1)
                  }
                  className="min-w-[32px] h-8 flex items-center justify-center rounded-md text-sm font-medium text-stone-500 hover:bg-stone-100 transition-colors px-2 cursor-pointer"
                >
                  {enhancedTable.getPageCount()}
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={() => enhancedTable.nextPage()}
            disabled={!enhancedTable.getCanNextPage()}
            className="p-1 text-stone-500 hover:text-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
