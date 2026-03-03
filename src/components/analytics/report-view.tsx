//src/components/analytics/report-view.tsx

'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { TimePeriod } from '@/types/trade'

type ReportData = Awaited<ReturnType<typeof import('@/actions/analytics-report').getAnalyticsReport>>
type StatSet = NonNullable<ReportData['all']>

const PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'year', label: 'This year' },
  { value: 'quarter', label: 'Quarter' },
  { value: 'month', label: 'Month' },
  { value: 'week', label: 'Week' },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

function pnlColor(val: number) {
  if (val > 0) return 'text-emerald-500'
  if (val < 0) return 'text-red-500'
  return 'text-muted-foreground'
}

function fmt(val: number, decimals = 2) {
  return val.toFixed(decimals)
}

function fmtCurrency(val: number) {
  return formatCurrency(Math.abs(val))
}

function sign(val: number) {
  return val >= 0 ? '+' : '−'
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 mt-6 first:mt-0">
      {children}
    </h2>
  )
}

function MetricTable({
  rows,
  all,
  long,
  short,
  showLongShort = true,
}: {
  rows: {
    label: string
    all: React.ReactNode
    long?: React.ReactNode
    short?: React.ReactNode
  }[]
  all?: StatSet | null
  long?: StatSet | null
  short?: StatSet | null
  showLongShort?: boolean
}) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider w-1/2">
              Metric
            </th>
            <th className="text-right px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              All
            </th>
            {showLongShort && (
              <>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-emerald-500/70 uppercase tracking-wider">
                  Long
                </th>
                <th className="text-right px-4 py-2.5 text-xs font-medium text-red-500/70 uppercase tracking-wider">
                  Short
                </th>
              </>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-muted/10 transition-colors">
              <td className="px-4 py-2.5 text-muted-foreground">{row.label}</td>
              <td className="px-4 py-2.5 text-right font-medium">{row.all}</td>
              {showLongShort && (
                <>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{row.long ?? '—'}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{row.short ?? '—'}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TopCard({
  label, value, sub, subColor, currency = true,
}: {
  label: string
  value: number
  sub?: string
  subColor?: string
  currency?: boolean
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <p className="text-xs text-muted-foreground mb-2">{label}</p>
      <p className={cn('text-2xl font-bold', pnlColor(value))}>
        {value >= 0 ? '' : '−'}{currency ? fmtCurrency(value) : fmt(Math.abs(value))}
        {!currency && ''}
      </p>
      {sub && (
        <p className={cn('text-xs mt-0.5', subColor ?? 'text-muted-foreground')}>{sub}</p>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

interface ReportViewProps {
  report: ReportData
  period: TimePeriod
}

export function ReportView({ report, period }: ReportViewProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { all, long, short } = report

  function setPeriod(p: TimePeriod) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('period', p)
    router.push(`${pathname}?${params.toString()}`)
  }

  function val(s: StatSet | null | undefined, key: keyof StatSet): number {
    return s ? Number(s[key] ?? 0) : 0
  }

  function cell(s: StatSet | null | undefined, key: keyof StatSet, opts?: {
    prefix?: string
    suffix?: string
    color?: boolean
    pct?: boolean
    pctKey?: keyof StatSet
  }) {
    if (!s) return <span className="text-muted-foreground">—</span>
    const v = Number(s[key] ?? 0)
    const pctVal = opts?.pctKey ? Number(s[opts.pctKey] ?? 0) : null
    const colored = opts?.color !== false
    return (
      <div className={colored ? pnlColor(v) : ''}>
        <span>
          {opts?.prefix ?? ''}{fmt(Math.abs(v))} {opts?.suffix ?? 'USD'}
        </span>
        {pctVal !== null && (
          <div className="text-xs text-muted-foreground">
            {sign(pctVal)}{fmt(Math.abs(pctVal))}%
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Performance Report</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Detailed breakdown of your trading performance
          </p>
        </div>

        {/* Period selector */}
        <div className="flex items-center gap-1.5 bg-muted/30 border border-border rounded-lg p-1">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                period === p.value
                  ? 'bg-card border border-border shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Top summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-2">Initial Capital</p>
          <p className="text-2xl font-bold">{fmtCurrency(report.initialCapital)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">USD</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-2">Open P&L</p>
          <p className={cn('text-2xl font-bold', pnlColor(report.openPnl))}>
            {sign(report.openPnl)}{fmtCurrency(report.openPnl)}
          </p>
          <p className={cn('text-xs mt-0.5', pnlColor(report.openPnlPct))}>
            {sign(report.openPnlPct)}{fmt(Math.abs(report.openPnlPct))}%
            · {report.openTradesCount} open
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-2">Net P&L</p>
          <p className={cn('text-2xl font-bold', pnlColor(val(all, 'totalNetPnl')))}>
            {sign(val(all, 'totalNetPnl'))}{fmtCurrency(val(all, 'totalNetPnl'))}
          </p>
          <p className={cn('text-xs mt-0.5', pnlColor(val(all, 'totalNetPnlPct')))}>
            {sign(val(all, 'totalNetPnlPct'))}{fmt(Math.abs(val(all, 'totalNetPnlPct')))}%
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-2">Profit Factor</p>
          <p className={cn('text-2xl font-bold', pnlColor(val(all, 'profitFactor') - 1))}>
            {fmt(val(all, 'profitFactor'), 3)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Gross wins / gross losses
          </p>
        </div>
      </div>

      {/* P&L Breakdown */}
      <div>
        <SectionTitle>P&L Overview</SectionTitle>
        <MetricTable rows={[
          {
            label: 'Gross Profit',
            all: cell(all, 'grossProfit', { color: true, pctKey: 'grossProfitPct' }),
            long: cell(long, 'grossProfit', { color: true, pctKey: 'grossProfitPct' }),
            short: cell(short, 'grossProfit', { color: true, pctKey: 'grossProfitPct' }),
          },
          {
            label: 'Gross Loss',
            all: cell(all, 'grossLoss', { color: false, pctKey: 'grossLossPct' }),
            long: cell(long, 'grossLoss', { color: false, pctKey: 'grossLossPct' }),
            short: cell(short, 'grossLoss', { color: false, pctKey: 'grossLossPct' }),
          },
          {
            label: 'Net P&L',
            all: cell(all, 'totalNetPnl', { color: true, pctKey: 'totalNetPnlPct' }),
            long: cell(long, 'totalNetPnl', { color: true, pctKey: 'totalNetPnlPct' }),
            short: cell(short, 'totalNetPnl', { color: true, pctKey: 'totalNetPnlPct' }),
          },
          {
            label: 'Commission Paid',
            all: cell(all, 'totalCommission', { color: false }),
            long: cell(long, 'totalCommission', { color: false }),
            short: cell(short, 'totalCommission', { color: false }),
          },
          {
            label: 'Profit Factor',
            all: all ? <span className={pnlColor(all.profitFactor - 1)}>{fmt(all.profitFactor, 3)}</span> : '—',
            long: long ? <span className={pnlColor(long.profitFactor - 1)}>{fmt(long.profitFactor, 3)}</span> : '—',
            short: short ? <span className={pnlColor(short.profitFactor - 1)}>{fmt(short.profitFactor, 3)}</span> : '—',
          },
          {
            label: 'Expected Payoff',
            all: cell(all, 'expectedPayoff', { color: true, pctKey: 'expectedPayoffPct' }),
            long: cell(long, 'expectedPayoff', { color: true, pctKey: 'expectedPayoffPct' }),
            short: cell(short, 'expectedPayoff', { color: true, pctKey: 'expectedPayoffPct' }),
          },
        ]} />
      </div>

      {/* Benchmark */}
      <div>
        <SectionTitle>Benchmark Comparison</SectionTitle>
        <MetricTable showLongShort={false} rows={[
          {
            label: 'Buy & Hold Return',
            all: (
              <span className={pnlColor(report.buyHoldReturn)}>
                {sign(report.buyHoldReturn)}{fmtCurrency(report.buyHoldReturn)}
                <span className="text-xs ml-1">({sign(report.buyHoldPct)}{fmt(Math.abs(report.buyHoldPct))}%)</span>
              </span>
            ),
          },
          {
            label: 'Strategy Outperformance',
            all: (
              <span className={pnlColor(report.strategyOutperformance)}>
                {sign(report.strategyOutperformance)}{fmtCurrency(report.strategyOutperformance)}
              </span>
            ),
          },
        ]} />
      </div>

      {/* Risk-adjusted */}
      <div>
        <SectionTitle>Risk-Adjusted Performance</SectionTitle>
        <MetricTable showLongShort={false} rows={[
          {
            label: 'Sharpe Ratio',
            all: all ? <span className={pnlColor(all.sharpe)}>{fmt(all.sharpe, 3)}</span> : '—',
          },
          {
            label: 'Sortino Ratio',
            all: all ? <span className={pnlColor(all.sortino)}>{fmt(all.sortino, 3)}</span> : '—',
          },
        ]} />
      </div>

      {/* Trades Analysis */}
      <div>
        <SectionTitle>Trades Analysis</SectionTitle>
        <MetricTable rows={[
          {
            label: 'Total Trades',
            all: <span>{val(all, 'totalTrades')}</span>,
            long: <span>{val(long, 'totalTrades')}</span>,
            short: <span>{val(short, 'totalTrades')}</span>,
          },
          {
            label: 'Winning Trades',
            all: all ? <span className="text-emerald-500">{all.winningTrades} ({fmt(all.winRate)}%)</span> : '—',
            long: long ? <span className="text-emerald-500">{long.winningTrades} ({fmt(long.winRate)}%)</span> : '—',
            short: short ? <span className="text-emerald-500">{short.winningTrades} ({fmt(short.winRate)}%)</span> : '—',
          },
          {
            label: 'Losing Trades',
            all: all ? <span className="text-red-500">{all.losingTrades} ({fmt(100 - all.winRate)}%)</span> : '—',
            long: long ? <span className="text-red-500">{long.losingTrades} ({fmt(100 - long.winRate)}%)</span> : '—',
            short: short ? <span className="text-red-500">{short.losingTrades} ({fmt(100 - short.winRate)}%)</span> : '—',
          },
          {
            label: 'Break Even',
            all: all ? <span>{all.breakevenTrades}</span> : '—',
            long: long ? <span>{long.breakevenTrades}</span> : '—',
            short: short ? <span>{short.breakevenTrades}</span> : '—',
          },
          {
            label: 'Avg P&L',
            all: cell(all, 'expectedPayoff', { color: true, pctKey: 'expectedPayoffPct' }),
            long: cell(long, 'expectedPayoff', { color: true, pctKey: 'expectedPayoffPct' }),
            short: cell(short, 'expectedPayoff', { color: true, pctKey: 'expectedPayoffPct' }),
          },
          {
            label: 'Avg Winning Trade',
            all: cell(all, 'avgWin', { color: true, pctKey: 'avgWinPct' }),
            long: cell(long, 'avgWin', { color: true, pctKey: 'avgWinPct' }),
            short: cell(short, 'avgWin', { color: true, pctKey: 'avgWinPct' }),
          },
          {
            label: 'Avg Losing Trade',
            all: cell(all, 'avgLoss', { color: false, pctKey: 'avgLossPct' }),
            long: cell(long, 'avgLoss', { color: false, pctKey: 'avgLossPct' }),
            short: cell(short, 'avgLoss', { color: false, pctKey: 'avgLossPct' }),
          },
          {
            label: 'Ratio Avg Win / Avg Loss',
            all: all ? <span className={pnlColor(all.ratioAvgWinLoss - 1)}>{fmt(all.ratioAvgWinLoss, 3)}</span> : '—',
            long: long ? <span>{fmt(long.ratioAvgWinLoss, 3)}</span> : '—',
            short: short ? <span>{fmt(short.ratioAvgWinLoss, 3)}</span> : '—',
          },
          {
            label: 'Largest Winning Trade',
            all: cell(all, 'largestWin', { color: true, pctKey: 'largestWinPct' }),
            long: cell(long, 'largestWin', { color: true, pctKey: 'largestWinPct' }),
            short: cell(short, 'largestWin', { color: true, pctKey: 'largestWinPct' }),
          },
          {
            label: 'Largest Winner as % of Gross Profit',
            all: all ? <span>{fmt(all.largestWinOfGross)}%</span> : '—',
            long: long ? <span>{fmt(long.largestWinOfGross)}%</span> : '—',
            short: short ? <span>{fmt(short.largestWinOfGross)}%</span> : '—',
          },
          {
            label: 'Largest Losing Trade',
            all: cell(all, 'largestLoss', { color: false, pctKey: 'largestLossPct' }),
            long: cell(long, 'largestLoss', { color: false, pctKey: 'largestLossPct' }),
            short: cell(short, 'largestLoss', { color: false, pctKey: 'largestLossPct' }),
          },
          {
            label: 'Largest Loser as % of Gross Loss',
            all: all ? <span>{fmt(all.largestLossOfGross)}%</span> : '—',
            long: long ? <span>{fmt(long.largestLossOfGross)}%</span> : '—',
            short: short ? <span>{fmt(short.largestLossOfGross)}%</span> : '—',
          },
          {
            label: 'Avg Duration (minutes)',
            all: all ? <span>{all.avgBars.toLocaleString()}</span> : '—',
            long: long ? <span>{long.avgBars.toLocaleString()}</span> : '—',
            short: short ? <span>{short.avgBars.toLocaleString()}</span> : '—',
          },
          {
            label: 'Avg Duration — Winners',
            all: all ? <span>{all.avgBarsWinners.toLocaleString()}</span> : '—',
            long: long ? <span>{long.avgBarsWinners.toLocaleString()}</span> : '—',
            short: short ? <span>{short.avgBarsWinners.toLocaleString()}</span> : '—',
          },
          {
            label: 'Avg Duration — Losers',
            all: all ? <span>{all.avgBarsLosers.toLocaleString()}</span> : '—',
            long: long ? <span>{long.avgBarsLosers.toLocaleString()}</span> : '—',
            short: short ? <span>{short.avgBarsLosers.toLocaleString()}</span> : '—',
          },
        ]} />
      </div>

      {/* Capital Efficiency */}
      <div>
        <SectionTitle>Capital Efficiency</SectionTitle>
        <MetricTable rows={[
          {
            label: 'Annualized Return (CAGR)',
            all: all ? <span className={pnlColor(all.cagr)}>{sign(all.cagr)}{fmt(Math.abs(all.cagr))}%</span> : '—',
            long: long ? <span className={pnlColor(long.cagr)}>{sign(long.cagr)}{fmt(Math.abs(long.cagr))}%</span> : '—',
            short: short ? <span className={pnlColor(short.cagr)}>{sign(short.cagr)}{fmt(Math.abs(short.cagr))}%</span> : '—',
          },
          {
            label: 'Return on Initial Capital',
            all: all ? <span className={pnlColor(all.returnOnCapital)}>{sign(all.returnOnCapital)}{fmt(Math.abs(all.returnOnCapital))}%</span> : '—',
            long: long ? <span className={pnlColor(long.returnOnCapital)}>{sign(long.returnOnCapital)}{fmt(Math.abs(long.returnOnCapital))}%</span> : '—',
            short: short ? <span className={pnlColor(short.returnOnCapital)}>{sign(short.returnOnCapital)}{fmt(Math.abs(short.returnOnCapital))}%</span> : '—',
          },
          {
            label: 'Account Size Required',
            all: <span>{fmtCurrency(report.accountSizeRequired)} USD</span>,
          },
          {
            label: 'Net Profit as % of Largest Loss',
            all: all ? <span className={pnlColor(all.netProfitVsLargestLoss)}>{fmt(all.netProfitVsLargestLoss)}%</span> : '—',
            long: long ? <span className={pnlColor(long.netProfitVsLargestLoss)}>{fmt(long.netProfitVsLargestLoss)}%</span> : '—',
            short: short ? <span className={pnlColor(short.netProfitVsLargestLoss)}>{fmt(short.netProfitVsLargestLoss)}%</span> : '—',
          },
        ]} />
      </div>

      {/* Run-ups & Drawdowns */}
      <div>
        <SectionTitle>Run-ups & Drawdowns</SectionTitle>
        <MetricTable showLongShort={false} rows={[
          {
            label: 'Max Equity Run-up',
            all: all ? (
              <span className="text-emerald-500">
                {fmtCurrency(all.maxRunup)} USD
                <span className="text-xs ml-1">({fmt(all.maxRunupPct)}%)</span>
              </span>
            ) : '—',
          },
          {
            label: 'Avg Equity Run-up',
            all: all ? (
              <span className="text-emerald-500">
                {fmtCurrency(all.avgRunup)} USD
                <span className="text-xs text-muted-foreground ml-1">~{all.avgRunupDays} trades</span>
              </span>
            ) : '—',
          },
          {
            label: 'Max Equity Drawdown',
            all: all ? (
              <span className="text-red-500">
                {fmtCurrency(all.maxDrawdown)} USD
                <span className="text-xs ml-1">({fmt(all.maxDrawdownPct)}%)</span>
              </span>
            ) : '—',
          },
          {
            label: 'Avg Equity Drawdown',
            all: all ? (
              <span className="text-red-500">
                {fmtCurrency(all.avgDrawdown)} USD
                <span className="text-xs text-muted-foreground ml-1">~{all.avgDrawdownDays} trades</span>
              </span>
            ) : '—',
          },
          {
            label: 'Max Drawdown as % of Initial Capital',
            all: all ? (
              <span className="text-red-500">{fmt(all.maxDrawdownPct)}%</span>
            ) : '—',
          },
          {
            label: 'Return at Max Drawdown',
            all: all ? (
              <span className={pnlColor(-all.maxDrawdown)}>
                −{fmtCurrency(all.maxDrawdown)} USD
              </span>
            ) : '—',
          },
        ]} />
      </div>
    </div>
  )
}