//src/app/(dashboard)/trades/loading.tsx

import { Skeleton } from '@/components/ui/skeleton'

export default function TradesLoading() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-20 mb-1" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-lg" />
          ))}
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-28 rounded-lg" />
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-border px-4 py-3 flex gap-4">
          {[120, 80, 80, 100, 80, 80, 60].map((w, i) => (
            <Skeleton key={i} className={`h-3 w-${w}`} style={{ width: w }} />
          ))}
        </div>
        {/* Rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="border-b border-border/50 last:border-0 px-4 py-3.5 flex items-center gap-4">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-3.5 w-12" />
            <Skeleton className="h-3.5 w-16" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}