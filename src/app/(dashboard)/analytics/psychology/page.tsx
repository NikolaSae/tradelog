// src/app/(dashboard)/analytics/psychology/page.tsx
import { getPsychologyAnalytics } from '@/actions/analytics'
import { UpgradeGate } from '@/components/shared/upgrade-gate'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { formatCurrency } from '@/lib/utils'
import { Brain } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Psychology Analytics' }

const emotionEmoji: Record<string, string> = {
  CONFIDENT: '😎', FEARFUL: '😨', GREEDY: '🤑',
  NEUTRAL: '😐', REVENGE: '😤', FOMO: '😰',
  PATIENT: '🧘', UNTAGGED: '—',
}

export default async function PsychologyAnalyticsPage() {
  const data = await getPsychologyAnalytics('month')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Psychology"
        description="How your emotions affect your trading performance"
      />

      <UpgradeGate feature="PSYCHOLOGY_TRACKING">
        {!data ? (
          <EmptyState
            icon={Brain}
            title="No data yet"
            description="Tag your trades with emotions to see psychology analytics"
            action={{ label: 'Add a trade', href: '/trades/new' }}
          />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tag your trades with emotion tags to track how your mental state affects performance.
            </p>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Emotion</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">Trades</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">Win Rate</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">Total P&L</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">Avg P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {data.emotionStats.map((stat) => (
                    <tr key={stat.emotion} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{emotionEmoji[stat.emotion] ?? '—'}</span>
                          <span className="font-medium capitalize">
                            {stat.emotion.toLowerCase()}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">{stat.trades}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={stat.winRate >= 50 ? 'text-emerald-500' : 'text-red-500'}>
                          {stat.winRate}%
                        </span>
                      </td>
                      <td className={`px-4 py-3 text-right font-semibold ${stat.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {stat.pnl >= 0 ? '+' : ''}{formatCurrency(stat.pnl)}
                      </td>
                      <td className={`px-4 py-3 text-right ${stat.avgPnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        {stat.avgPnl >= 0 ? '+' : ''}{formatCurrency(stat.avgPnl)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {data.emotionStats.some((s) => s.emotion === 'REVENGE' || s.emotion === 'FOMO') && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-sm">
                <p className="font-medium text-destructive mb-1">⚠️ Emotional trading detected</p>
                <p className="text-muted-foreground">
                  You have trades tagged as Revenge or FOMO. These emotions are typically associated with poor outcomes. Consider taking a break when you notice these feelings.
                </p>
              </div>
            )}
          </div>
        )}
      </UpgradeGate>
    </div>
  )
}