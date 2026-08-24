import { Skeleton } from "@/components/ui/skeleton";

const COLUMN_WIDTHS = ["72%", "55%", "63%", "48%", "68%", "58%", "66%", "52%"];

interface DataTableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function DataTableSkeleton({ rows = 6, columns = 6 }: DataTableSkeletonProps) {
  const columnCount = Math.max(1, Math.min(columns, COLUMN_WIDTHS.length));
  const rowCount = Math.max(1, rows);

  return (
    <div className="w-full rounded-xl bg-card shadow-sm ring-1 ring-black/5 overflow-hidden" aria-hidden="true">
      {/* Barra superior */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <Skeleton className="h-9 min-w-72 max-w-full" />
          <Skeleton className="h-9 w-64 max-w-full" />
        </div>
        <Skeleton className="h-9 w-24" />
      </div>

      {/* Encabezado */}
      <div className="flex gap-4 px-4 py-3 bg-muted/30 border-b border-border">
        {Array.from({ length: columnCount }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" style={{ maxWidth: COLUMN_WIDTHS[i] }} />
        ))}
      </div>

      {/* Filas */}
      <div className="divide-y divide-border">
        {Array.from({ length: rowCount }).map((_, row) => (
          <div key={row} className="flex items-center gap-4 px-4 py-[15px]">
            {Array.from({ length: columnCount }).map((_, col) => (
              <div key={col} className="flex-1">
                <Skeleton
                  className={`h-4 ${(row + col) % 2 === 0 ? "max-w-[70%]" : "max-w-[55%]"}`}
                  style={col === 0 ? { width: "80%" } : undefined}
                />
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between p-4 border-t border-border">
        <Skeleton className="h-4 w-56" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-md" />
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded-md" />
          ))}
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>
    </div>
  );
}
