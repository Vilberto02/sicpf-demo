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
import { Eye, Edit, DollarSign, Ban, ChevronLeft, ChevronRight, ListFilter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

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
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Buscar por nombre",
  categories = [],
  statusHeaderProps,
  onView,
  onEdit,
  onFinance,
  onBlock,
}: DataTableProps<TData, TValue>) {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex: 0,
        pageSize: itemsPerPage,
      },
    },
  });

  const handleSearch = (value: string) => {
    setGlobalFilter(value);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === "Todas las categorias") {
      table.getColumn("category")?.setFilterValue("");
    } else {
      table.getColumn("category")?.setFilterValue(category);
    }
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
        className={`px-2 py-1 rounded-md text-xs font-medium border ${getStateText(status) || "border-gray-500 text-gray-500"}`}
      >
        {status}
      </span>
    );
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const ActionIcons = ({ row }: { row: TData }) => (
    <div className="flex items-center gap-2">
      {onView && (
        <button
          onClick={() => onView(row)}
          className="p-1 text-teal-400 hover:text-teal-300 transition-colors"
        >
          <Eye className="h-4 w-4" />
        </button>
      )}
      {onEdit && (
        <button
          onClick={() => onEdit(row)}
          className="p-1 text-teal-400 hover:text-teal-300 transition-colors"
        >
          <Edit className="h-4 w-4" />
        </button>
      )}
      {onFinance && (
        <button
          onClick={() => onFinance(row)}
          className="p-1 text-yellow-500 hover:text-yellow-400 transition-colors"
        >
          <DollarSign className="h-4 w-4" />
        </button>
      )}
      {onBlock && (
        <button
          onClick={() => onBlock(row)}
          className="p-1 text-yellow-500 hover:text-yellow-400 transition-colors"
        >
          <Ban className="h-4 w-4" />
        </button>
      )}
    </div>
  );

  const enhancedColumns = useMemo(() => {
    return [
      ...columns,
      ...(columns.some(col => col.id === "status") ? [] : [{
        id: "status",
        header: statusHeaderProps,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cell: ({ row }: any) => {
          const status = row.original.status || "Activo";
          return <StatusBadge status={status} />;
        },
      }]),
      ...(columns.some(col => col.id === "actions") ? [] : [{
        id: "actions",
        header: "Acciones",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        cell: ({ row }: any) => <ActionIcons row={row.original} />,
      }]),
    ];
  }, [ActionIcons, columns, statusHeaderProps]);

  const enhancedTable = useReactTable({
    data,
    columns: enhancedColumns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      columnFilters,
      globalFilter,
      pagination: {
        pageIndex: table.getState().pagination.pageIndex,
        pageSize: itemsPerPage,
      },
    },
  });

  return (
    <div className="w-full rounded-lg">
      {/* Barra superior */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
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
            <Select>
              <SelectTrigger
                className="w-64"
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.currentTarget.value)}
              >
                <SelectValue placeholder="Selecciona una opción" />
              </SelectTrigger>
              <SelectContent>
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
        <Button>
          <ListFilter className="h-4 w-4" />
          Filtrar
        </Button>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg">
        <table className="w-full">
          <thead>
            {enhancedTable.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-stone-400">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="text-left py-3 px-4 text-sm font-medium bg-stone-100"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {enhancedTable.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-stone-300 hover:bg-stone-50 transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="py-3 px-4 text-sm">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between p-4 ">
        {/* Selector de items por página */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-600">Mostrar</span>
          <Select>
            <SelectTrigger
              className="w-28"
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.currentTarget.value))}
            >
              <SelectValue placeholder="5/pag." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5/pag.</SelectItem>
              <SelectItem value="10">10/pag.</SelectItem>
              <SelectItem value="20">20/pag.</SelectItem>
              <SelectItem value="50">50/pag.</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Navegación de páginas */}
        <div className="flex items-center gap-2">
          <Button
            variant={"secondary"}
            onClick={() => enhancedTable.previousPage()}
            disabled={!enhancedTable.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from(
              { length: Math.min(5, enhancedTable.getPageCount()) },
              (_, i) => {
                const pageIndex = i;
                return (
                  <Button
                    key={pageIndex}
                    onClick={() => enhancedTable.setPageIndex(pageIndex)}
                    className={`${
                      enhancedTable.getState().pagination.pageIndex ===
                      pageIndex
                        ? "bg-teal-600 text-white"
                        : "text-gray-400 hover:text-gray-100 hover:bg-gray-700"
                    }`}
                  >
                    {pageIndex + 1}
                  </Button>
                );
              }
            )}
            {enhancedTable.getPageCount() > 5 && (
              <>
                <span className="text-gray-500">...</span>
                <Button
                  onClick={() =>
                    enhancedTable.setPageIndex(enhancedTable.getPageCount() - 1)
                  }
                  className="text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-700 transition-colors"
                >
                  {enhancedTable.getPageCount()}
                </Button>
              </>
            )}
          </div>
          
          <Button
            variant={"secondary"}
            onClick={() => enhancedTable.nextPage()}
            disabled={!enhancedTable.getCanNextPage()}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
