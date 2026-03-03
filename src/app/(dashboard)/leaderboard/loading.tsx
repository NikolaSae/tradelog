//src/app/(dashboard)/leaderboard/loading.tsx

import { Skeleton } from '@/components/ui/skeleton'

export default function LeaderboardLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-36 mb-1" />
        <Skeleton className="h-4 w-48" />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-muted/30 px-4 py-3 flex gap-6">
          {[30, 160, 80, 80, 80, 80, 80, 80, 80, 80].map((w, i) => (
            <Skeleton key={i} className="h-3" style={{ width: w }} />
          ))}
        </div>

        {/* Rows */}
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="border-b border-border/50 last:border-0 px-4 py-3 flex items-center gap-6">
            <Skeleton className="h-7 w-7 rounded-full shrink-0" />
            <div className="flex items-center gap-2" style={{ width: 160 }}>
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-3.5 w-20" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
            {Array.from({ length: 8 }).map((_, j) => (
              <Skeleton key={j} className="h-3.5 w-16 ml-auto" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}