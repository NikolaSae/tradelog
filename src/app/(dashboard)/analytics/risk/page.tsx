// src/app/(dashboard)/analytics/risk/page.tsx
import { getRiskAnalytics } from '@/actions/analytics'
import { UpgradeGate } from '@/components/shared/upgrade-gate'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { RDistributionChart } from '@/components/analytics/r-distribution-chart'
import { formatCurrency } from '@/lib/utils'
import { Shield } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Risk Analytics' }

export default async function RiskAnalyticsPage() {
  const data = await getRiskAnalytics('month')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Risk"
        description="Drawdown, streaks, R-distribution and duration analysis"
      />

      <UpgradeGate feature="ADVANCED_ANALYTICS">
        {!data ? (
          <EmptyState
            icon={Shield}
            title="No data yet"
            description="Add some closed trades to see your risk analytics"
            action={{ label: 'Add a trade', href: '/trades/new' }}
          />
        ) : (
          <div className="space-y-6">
            {/* Key risk metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Max Drawdown', value: `-${formatCurrency(data.maxDrawdown)}`, color: 'text-red-500' },
                { label: 'Total Risk Taken', value: formatCurrency(data.totalRisk), color: 'text-red-400' },
                { label: 'Max Win Streak', value: `${data.maxWinStreak} trades`, color: 'text-emerald-500' },
                { label: 'Max Loss Streak', value: `${data.maxLossStreak} trades`, color: 'text-red-500' },
              ].map((stat) => (
                <div key={stat.label} className="bg-card border border-border rounded-xl p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">{stat.label}</p>
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Current streak */}
            <div className={`rounded-xl border p-5 ${
              data.currentStreak > 0
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : data.currentStreak < 0
                ? 'bg-red-500/5 border-red-500/20'
                : 'bg-card border-border'
            }`}>
              <p className="text-sm text-muted-foreground mb-1">Current Streak</p>
              <p className={`text-2xl font-bold ${
                data.currentStreak > 0 ? 'text-emerald-500' : data.currentStreak < 0 ? 'text-red-500' : ''
              }`}>
                {data.currentStreak > 0
                  ? `${data.currentStreak} wins in a row 🔥`
                  : data.currentStreak < 0
                  ? `${Math.abs(data.currentStreak)} losses in a row`
                  : 'No streak'}
              </p>
            </div>

            {/* R Distribution */}
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="font-semibold mb-1">R-Multiple Distribution</h2>
              <p className="text-xs text-muted-foreground mb-4">How your trades cluster by R-multiple outcome</p>
              <div className="h-56">
                <RDistributionChart data={data.rDistribution} />
              </div>
            </div>
          </div>
        )}
      </UpgradeGate>
    </div>
  )
}