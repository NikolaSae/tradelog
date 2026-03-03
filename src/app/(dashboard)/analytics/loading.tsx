//src/app/(dashboard)/analytics/loading.tsx


import { Skeleton } from '@/components/ui/skeleton'

export default function AnalyticsLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-32 mb-1" />
        <Skeleton className="h-4 w-56" />
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-card border border-border rounded-xl p-6">
            <Skeleton className="h-5 w-40 mb-1" />
            <Skeleton className="h-3 w-56 mb-4" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  )
}