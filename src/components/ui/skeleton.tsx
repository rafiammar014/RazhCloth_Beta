import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-xl bg-slate-200/80", className)}
      aria-hidden="true"
      {...props}
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full space-y-3" role="status" aria-label="Memuat data tabel...">
      <div className="flex gap-4 p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-xl">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-28 ml-auto" />
      </div>
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="flex items-center gap-4 px-4 py-3.5 border-b border-slate-100 last:border-0">
          <Skeleton className="h-5 w-20" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-3.5 w-1/4" />
          </div>
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-16 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

