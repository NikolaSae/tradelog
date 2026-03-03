//src/app/(dashboard)/dashboard/loading.tsx
import { Skeleton } from '@/components/ui/skeleton'

function KpiSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-28" />
      <Skeleton className="h-3 w-32" />
    </div>
  )
}

function ChartSkeleton({ height = 'h-56' }: { height?: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <Skeleton className="h-4 w-32 mb-1" />
      <Skeleton className="h-3 w-48 mb-4" />
      <Skeleton className={`w-full ${height} rounded-lg`} />
    </div>
  )
}

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-4 w-48" />
      </div>

      {/* KPI red 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>

      {/* KPI red 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartSkeleton />
        </div>
        <ChartSkeleton />
      </div>

      {/* Recent trades */}
      <div className="bg-card border border-border rounded-xl p-6">
        <Skeleton className="h-5 w-32 mb-1" />
        <Skeleton className="h-3 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2">
              <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3 w-36" />
              </div>
              <div className="space-y-1 text-right">
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}