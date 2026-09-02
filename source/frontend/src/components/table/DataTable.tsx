import {
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  getCoreRowModel,
  getPaginationRowModel,
  getFilteredRowModel,
  flexRender,
} from "@tanstack/react-table";
import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  ListFilter,
  Eye,
  Pencil,
  DollarSign,
  Ban,
  ChevronLeft,
  ChevronRight,
  Printer,
  Trash2,
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Button } from "@/components/ui/button";
import { DataTableSkeleton } from "./DataTableSkeleton";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  categories?: string[];
  statusHeaderProps: string;
  loading?: boolean;
  onView?: (row: TData) => void;
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
  onFinance?: (row: TData) => void;
  onBlock?: (row: TData) => void;
  onPrint?: (row: TData) => void;
  serverSide?: boolean;
  totalCount?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onSearch?: (search: string) => void;
  onCategoryFilter?: (category: string) => void;
  customFilters?: React.ReactNode;
}

const ALIGN_CLASSES = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const;

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Buscar...",
  categories = [],
  statusHeaderProps = "Estado",
  loading = false,
  onView,
  onEdit,
  onDelete,
  onFinance,
  onBlock,
  onPrint,
  serverSide = false,
  totalCount = 0,
  page = 0,
  pageSize = 10,
  onPageChange,
  onSearch,
  onCategoryFilter,
  customFilters,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const [pagination, setPagination] = useState({
    pageIndex: serverSide ? page : 0,
    pageSize: serverSide ? pageSize : 10,
  });

  const handleSearch = useCallback((value: string) => {
    setGlobalFilter(value);
    if (serverSide && onSearch) {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      const timer = setTimeout(() => {
        onSearch(value);
      }, 300);
      debounceTimerRef.current = timer;
    }
  }, [serverSide, onSearch]);




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
          <Pencil className="h-4 w-4" />
        </Button>
      )}
      {onDelete && (
        <Button
          onClick={() => onDelete(row)}
          variant="ghost"
          className="p-1 text-red-600 hover:text-red-400 transition-colors cursor-pointer"
          title="Eliminar"
        >
          <Trash2 className="h-4 w-4" />
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
      ...((onView || onEdit || onDelete || onFinance || onBlock || onPrint)
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
  }, [ActionIcons, columns, statusHeaderProps, onView, onEdit, onDelete, onFinance, onBlock, onPrint]);

  const displayData = useMemo(() => {
    if (serverSide) return data;
    // Client-side filtering as fallback
    let filtered = data;
    if (globalFilter) {
      const term = globalFilter.toLowerCase();
      filtered = filtered.filter((row) =>
        Object.values(row as any).some(
          (val) => val !== null && val !== undefined && String(val).toLowerCase().includes(term)
        )
      );
    }
    if (selectedCategory && selectedCategory !== "Todos" && selectedCategory !== "Todas las categorias") {
      filtered = filtered.filter((row) => {
        const r = row as any;
        return r.categoria === selectedCategory || r.categoria_nombre === selectedCategory ||
               r.status === selectedCategory || r.nivel_riesgo === selectedCategory;
      });
    }
    return filtered;
  }, [data, serverSide, globalFilter, selectedCategory]);

  const effectiveTotalCount = serverSide ? totalCount : displayData.length;
  const effectivePageCount = Math.max(1, Math.ceil(effectiveTotalCount / (serverSide ? pageSize : pagination.pageSize)));
  const effectivePageIndex = serverSide ? page : pagination.pageIndex;

  const enhancedTable = useReactTable({
    data: displayData,
    columns: enhancedColumns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: serverSide ? undefined : getFilteredRowModel(),
    getPaginationRowModel: serverSide ? undefined : getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: (updater) => {
      if (!serverSide) {
        setPagination(updater);
      }
    },
    manualPagination: serverSide,
    pageCount: effectivePageCount,
    state: {
      columnFilters,
      globalFilter: serverSide ? "" : globalFilter,
      pagination: {
        pageIndex: effectivePageIndex,
        pageSize: serverSide ? pageSize : pagination.pageSize,
      },
    },
  });


  const handleCategoryChange = useCallback((value: string) => {
    setSelectedCategory(value);
    const normalizedCategory = value === "Todos" || value === "Todas las categorias" ? "" : value;
    if (serverSide) {
      if (onCategoryFilter) {
        onCategoryFilter(normalizedCategory);
      }
    } else {
      const col = enhancedTable.getColumn("categoria") || enhancedTable.getColumn("category") || enhancedTable.getColumn("status") || enhancedTable.getColumn("estado");
      if (col) {
        col.setFilterValue(normalizedCategory);
      }
    }
  }, [serverSide, onCategoryFilter, enhancedTable]);

  const handlePageChange = (newPage: number) => {
    if (serverSide && onPageChange) {
      onPageChange(newPage);
    } else {
      enhancedTable.setPageIndex(newPage);
    }
  };

  if (loading) {
    return <DataTableSkeleton rows={6} columns={Math.min(columns.length + 2, 8)} />;
  }

  const startItem = effectivePageIndex * (serverSide ? pageSize : pagination.pageSize) + 1;
  const endItem = Math.min((effectivePageIndex + 1) * (serverSide ? pageSize : pagination.pageSize), effectiveTotalCount);

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
              onValueChange={handleCategoryChange}
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

          {customFilters}
        </div>
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
                    className={`py-3 px-4 text-sm font-medium bg-muted/30 ${ALIGN_CLASSES[align as keyof typeof ALIGN_CLASSES] ?? ALIGN_CLASSES.left}`}
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
                    <td key={cell.id} className={`py-3 px-4 text-sm tabular-nums ${ALIGN_CLASSES[align as keyof typeof ALIGN_CLASSES] ?? ALIGN_CLASSES.left}`}>
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
            Mostrando {effectiveTotalCount > 0 ? startItem : 0} a {endItem} de {effectiveTotalCount} resultados
          </span>
        </div>

        {/* Navegación de páginas */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handlePageChange(effectivePageIndex - 1)}
            disabled={effectivePageIndex <= 0}
            className="p-1 text-stone-500 hover:text-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-1">
            {(() => {
              const pageCount = effectivePageCount;
              const current = effectivePageIndex;

              const renderPageButton = (pageIndex: number) => {
                const isActive = current === pageIndex;
                return (
                  <button
                    type="button"
                    key={pageIndex}
                    onClick={() => handlePageChange(pageIndex)}
                    className={`min-w-[32px] h-8 flex items-center justify-center rounded-md text-sm transition-colors px-2 cursor-pointer ${
                      isActive
                        ? "bg-primary text-primary-foreground font-bold shadow-sm"
                        : "text-muted-foreground hover:bg-muted font-medium"
                    }`}
                  >
                    {pageIndex + 1}
                  </button>
                );
              };

              if (pageCount <= 4) {
                return Array.from({ length: pageCount }, (_, i) => renderPageButton(i));
              }

              const visible = [...new Set([0, 1, current, pageCount - 2, pageCount - 1])]
                .filter((p) => p >= 0 && p < pageCount)
                .sort((a, b) => a - b);

              return visible.map((pageIndex, i) => (
                <div key={pageIndex} className="flex items-center gap-1">
                  {i > 0 && pageIndex - visible[i - 1] > 1 && (
                    <span className="text-stone-500 px-1">...</span>
                  )}
                  {renderPageButton(pageIndex)}
                </div>
              ));
            })()}
          </div>

          <button
            type="button"
            onClick={() => handlePageChange(effectivePageIndex + 1)}
            disabled={effectivePageIndex >= effectivePageCount - 1}
            className="p-1 text-stone-500 hover:text-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
