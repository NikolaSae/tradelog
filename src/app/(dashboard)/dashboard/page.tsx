//src/app/(dashboard)/dashboard/page.tsx
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import {
  TrendingUp, DollarSign, Target, Activity,
  Award, BarChart2, Zap,
} from 'lucide-react'
import { auth } from '@/lib/auth'
import { getTradeStats, getTrades } from '@/actions/trades'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { EquityCurve } from '@/components/dashboard/equity-curve'
import { PnlChart } from '@/components/dashboard/pnl-chart'
import { RecentTrades } from '@/components/dashboard/recent-trades'
import { formatCurrency, toLocalDateStr } from '@/lib/utils'
import { checkAlertsForCurrentUser } from '@/actions/alerts'
import { AlertChecker } from '@/components/dashboard/alert-checker'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Dashboard' }

function buildEquityCurve(closedTrades: any[]) {
  const sorted = [...closedTrades].sort(
    (a, b) =>
      new Date(a.closedAt ?? a.openedAt).getTime() -
      new Date(b.closedAt ?? b.openedAt).getTime()
  )

  const dailyMap = new Map<string, number>()
  let cumPnl = 0
  for (const t of sorted) {
    // FIX: lokalni datum umjesto UTC
    const date = toLocalDateStr(new Date(t.closedAt ?? t.openedAt))
    cumPnl += Number(t.netPnl ?? 0)
    dailyMap.set(date, Math.round(cumPnl * 100) / 100)
  }

  return Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, equity]) => ({ date, equity, pnl: 0 }))
}

function buildDailyPnl(closedTrades: any[]) {
  const dailyMap = new Map<string, number>()
  for (const t of closedTrades) {
    // FIX: lokalni datum umjesto UTC
    const date = toLocalDateStr(new Date(t.closedAt ?? t.openedAt))
    const pnl = Number(t.netPnl ?? 0)
    dailyMap.set(date, (dailyMap.get(date) ?? 0) + pnl)
  }
  return Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, pnl]) => ({ date, pnl: Math.round(pnl * 100) / 100 }))
}

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() })

  // FIX: redirect ako nema sesije
  if (!session) redirect('/login')

  const userName = session.user.name?.split(' ')[0] ?? 'Trader'

  const [stats, tradesData] = await Promise.all([
    getTradeStats('all'),
    // FIX: limit 2000 umjesto 10000 — dovoljno za chart, ne opterećuje memoriju
    getTrades({ period: 'all', limit: 2000 }),
  ])

  const allTrades = tradesData.trades
  const closedTrades = allTrades.filter(t => t.status === 'CLOSED')
  const openTrades   = allTrades.filter(t => t.status === 'OPEN')
  const recentTrades = [...allTrades].slice(0, 8)

  const equityCurveData = buildEquityCurve(closedTrades)
  const dailyPnlData    = buildDailyPnl(closedTrades)

  const pnlColor = stats.totalNetPnl >= 0 ? 'text-emerald-500' : 'text-red-500'

  const triggered = await checkAlertsForCurrentUser()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Good {getTimeOfDay()}, {userName} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's your trading overview — all time
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Net P&L"
          value={stats.totalTrades === 0 ? '—' : `${stats.totalNetPnl >= 0 ? '+' : ''}${formatCurrency(stats.totalNetPnl)}`}
          icon={<DollarSign />}
          subtitle={`${stats.totalTrades} trades total`}
          highlight={stats.totalNetPnl > 0}
          valueClassName={stats.totalTrades > 0 ? pnlColor : undefined}
        />
        <KpiCard
          title="Win Rate"
          value={stats.totalTrades === 0 ? '—' : `${stats.winRate}%`}
          icon={<Target />}
          subtitle={`${stats.winningTrades}W / ${stats.losingTrades}L · ${stats.tradingDays} days`}
          valueClassName={stats.winRate >= 50 ? 'text-emerald-500' : stats.winRate > 0 ? 'text-red-500' : undefined}
        />
        <KpiCard
          title="Profit Factor"
          value={stats.totalTrades === 0 ? '—' : stats.profitFactor.toFixed(2)}
          icon={<BarChart2 />}
          subtitle={
            stats.totalTrades === 0
              ? 'Gross wins / gross losses'
              : `+${formatCurrency(stats.grossWinTotal)} / -${formatCurrency(stats.grossLossTotal)}`
          }
          valueClassName={stats.profitFactor >= 1 ? 'text-emerald-500' : stats.profitFactor > 0 ? 'text-red-500' : undefined}
        />
        <KpiCard
          title="Total Trades"
          value={stats.totalTrades.toString()}
          icon={<Activity />}
          subtitle={openTrades.length > 0 ? `${openTrades.length} open` : 'All closed'}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Avg Win"
          value={stats.avgWin > 0 ? `+${formatCurrency(stats.avgWin)}` : '—'}
          icon={<TrendingUp />}
          subtitle={stats.largestWin > 0 ? `Best: +${formatCurrency(stats.largestWin)}` : undefined}
          valueClassName="text-emerald-500"
        />
        <KpiCard
          title="Avg Loss"
          value={stats.avgLoss > 0 ? `-${formatCurrency(stats.avgLoss)}` : '—'}
          icon={<TrendingUp />}
          subtitle={stats.largestLoss < 0 ? `Worst: ${formatCurrency(stats.largestLoss)}` : undefined}
          valueClassName="text-red-500"
        />
        <KpiCard
          title="Expectancy"
          value={stats.totalTrades === 0 ? '—' : `${stats.expectancy >= 0 ? '+' : ''}${formatCurrency(stats.expectancy)}`}
          icon={<Award />}
          subtitle="Per trade"
          valueClassName={stats.expectancy >= 0 ? 'text-emerald-500' : 'text-red-500'}
        />
        <KpiCard
          title="Avg R-Multiple"
          value={stats.avgRMultiple !== 0 ? `${stats.avgRMultiple >= 0 ? '+' : ''}${stats.avgRMultiple.toFixed(2)}R` : '—'}
          icon={<Zap />}
          valueClassName={stats.avgRMultiple >= 0 ? 'text-emerald-500' : 'text-red-500'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">Equity Curve</h2>
              <p className="text-xs text-muted-foreground">Cumulative P&L — all time</p>
            </div>
          </div>
          <div className="h-56">
            <EquityCurve data={equityCurveData} />
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <div className="mb-4">
            <h2 className="font-semibold">Daily P&L</h2>
            <p className="text-xs text-muted-foreground">P&L per trading day</p>
          </div>
          <div className="h-56">
            <PnlChart data={dailyPnlData} />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold">Recent Trades</h2>
            <p className="text-xs text-muted-foreground">Your latest activity</p>
          </div>
        </div>
        <RecentTrades trades={recentTrades as any} />
        <AlertChecker triggered={triggered} />
      </div>
    </div>
  )
}

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}