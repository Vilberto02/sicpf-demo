import { Skeleton } from "@/components/ui/skeleton";

export function MainPageSkeleton() {
  return (
    <div className="flex w-screen h-screen bg-background">
      {/* Sidebar Skeleton */}
      <div className="w-64 h-full bg-card border-r border-border p-6 flex flex-col gap-6">
        <Skeleton className="h-10 w-32" />
        <div className="flex flex-col gap-2 mt-8">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      {/* Main Content Skeleton */}
      <div className="flex-1 p-6 md:p-10 flex flex-col gap-8 overflow-hidden">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-10 w-48 rounded-full" />
        </div>
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="flex-1 rounded-xl min-h-[300px]" />
      </div>
    </div>
  );
}