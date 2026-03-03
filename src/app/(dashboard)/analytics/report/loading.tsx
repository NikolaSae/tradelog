//src/app/(dashboard)/analytics/report/loading.tsx

import { Skeleton } from '@/components/ui/skeleton'

export default function ReportLoading() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-7 w-48 mb-1" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-64 rounded-lg" />
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Tables */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-3 w-32 mb-3" />
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="border-b border-border bg-muted/30 px-4 py-2.5 flex gap-4">
              {[200, 80, 80, 80].map((w, j) => (
                <Skeleton key={j} className="h-3" style={{ width: w }} />
              ))}
            </div>
            {Array.from({ length: 4 }).map((_, j) => (
              <div key={j} className="border-b border-border/40 last:border-0 px-4 py-2.5 flex gap-4">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-3 w-20 ml-auto" />
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}