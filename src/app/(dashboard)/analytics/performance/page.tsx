// src/app/(dashboard)/analytics/performance/page.tsx
import { getPerformanceAnalytics } from '@/actions/analytics'
import { UpgradeGate } from '@/components/shared/upgrade-gate'
import { PageHeader } from '@/components/shared/page-header'
import { PnlBySymbolChart } from '@/components/analytics/pnl-by-symbol-chart'
import { PnlByDayChart } from '@/components/analytics/pnl-by-day-chart'
import { PnlBySessionChart } from '@/components/analytics/pnl-by-session-chart'
import { DirectionStats } from '@/components/analytics/direction-stats'
import { EmptyState } from '@/components/shared/empty-state'
import { BarChart2 } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Performance Analytics' }

export default async function PerformanceAnalyticsPage() {
  const data = await getPerformanceAnalytics('month')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Performance"
        description="P&L breakdown across symbols, sessions, and days"
      />

      <UpgradeGate feature="ADVANCED_ANALYTICS">
        {!data ? (
          <EmptyState
            icon={BarChart2}
            title="No data yet"
            description="Add some closed trades to see your performance analytics"
            action={{ label: 'Add a trade', href: '/trades/new' }}
          />
        ) : (
          <div className="space-y-6">
            {/* Direction stats */}
            <DirectionStats data={data.directionStats} />

            {/* P&L by Symbol */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold mb-1">P&L by Symbol</h2>
              <p className="text-xs text-muted-foreground mb-4">Net P&L and trade count per instrument</p>
              <div className="h-64">
                <PnlBySymbolChart data={data.pnlBySymbol} />
              </div>
            </div>

            {/* P&L by Day of Week */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold mb-1">P&L by Day of Week</h2>
              <p className="text-xs text-muted-foreground mb-4">Which days are most profitable for you</p>
              <div className="h-56">
                <PnlByDayChart data={data.pnlByDay} />
              </div>
            </div>

            {/* P&L by Session */}
            {data.pnlBySession.length > 0 && (
              <div className="bg-card border border-border rounded-xl p-6">
                <h2 className="font-semibold mb-1">P&L by Session</h2>
                <p className="text-xs text-muted-foreground mb-4">Performance across trading sessions</p>
                <div className="h-56">
                  <PnlBySessionChart data={data.pnlBySession} />
                </div>
              </div>
            )}
          </div>
        )}
      </UpgradeGate>
    </div>
  )
}