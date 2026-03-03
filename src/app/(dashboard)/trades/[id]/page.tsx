//src/app/(dashboard)/trades/[id]/page.tsx
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import {
  ArrowLeft, TrendingUp, TrendingDown, Clock,
  Calendar, Tag, MessageSquare, Edit, Trash2,
} from 'lucide-react'
import { auth } from '@/lib/auth'
import { getTrade, deleteTrade } from '@/actions/trades'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TradeDeleteButton } from '@/components/trades/trade-delete-button'
import { formatCurrency, getPnlColor } from '@/lib/utils'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const trade = await getTrade(id)
  return { title: trade ? `${trade.symbol} ${trade.direction}` : 'Trade' }
}

function DetailRow({ label, value, valueClassName }: {
  label: string
  value: string | number | null | undefined
  valueClassName?: string
}) {
  if (value === null || value === undefined || value === '') return null
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${valueClassName ?? ''}`}>
        {value}
      </span>
    </div>
  )
}

export default async function TradePage({ params }: Props) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const trade = await getTrade(id)
  if (!trade) notFound()

  const pnl = Number(trade.netPnl ?? 0)
  const grossPnl = Number(trade.grossPnl ?? 0)
  const rMultiple = trade.rMultiple ? Number(trade.rMultiple) : null
  const isClosed = trade.status !== 'OPEN'
  const isLong = trade.direction === 'LONG'

  const openDate = trade.openedAt.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const closeDate = trade.closedAt?.toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })

  function formatDuration(minutes: number | null): string {
    if (!minutes) return '—'
    if (minutes < 60) return `${minutes}m`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Back */}
      <Button variant="ghost" size="sm" asChild>
        <Link href="/trades">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Trades
        </Link>
      </Button>

      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isLong ? 'bg-emerald-500/10' : 'bg-red-500/10'
            }`}>
              {isLong
                ? <TrendingUp className="h-6 w-6 text-emerald-500" />
                : <TrendingDown className="h-6 w-6 text-red-500" />
              }
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{trade.symbol}</h1>
                <Badge variant="outline" className={
                  isLong
                    ? 'border-emerald-500/30 text-emerald-500'
                    : 'border-red-500/30 text-red-500'
                }>
                  {trade.direction}
                </Badge>
                <Badge variant="outline" className={
                  trade.status === 'CLOSED'
                    ? 'border-border text-muted-foreground'
                    : 'border-blue-500/30 text-blue-500'
                }>
                  {trade.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {openDate}
              </p>
            </div>
          </div>

          {/* P&L */}
          {isClosed && trade.netPnl !== null && (
            <div className="text-right shrink-0">
              <p className={`text-2xl font-bold ${getPnlColor(pnl)}`}>
                {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
              </p>
              {rMultiple !== null && (
                <p className={`text-sm font-medium ${getPnlColor(rMultiple)}`}>
                  {rMultiple >= 0 ? '+' : ''}{rMultiple.toFixed(2)}R
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Entry / Exit */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Execution
        </h2>
        <DetailRow label="Entry Price" value={Number(trade.entryPrice).toFixed(5)} />
        <DetailRow label="Exit Price" value={trade.exitPrice ? Number(trade.exitPrice).toFixed(5) : '—'} />
        <DetailRow label="Stop Loss" value={trade.stopLoss ? Number(trade.stopLoss).toFixed(5) : '—'} />
        <DetailRow label="Take Profit" value={trade.takeProfit ? Number(trade.takeProfit).toFixed(5) : '—'} />
        <DetailRow label="Lot Size" value={`${Number(trade.lotSize).toFixed(2)} lots`} />
        <DetailRow label="Opened At" value={openDate} />
        <DetailRow label="Closed At" value={closeDate ?? '—'} />
        <DetailRow label="Duration" value={formatDuration(trade.durationMinutes)} />
        <DetailRow label="Session" value={trade.session ?? '—'} />
      </div>

      {/* P&L Breakdown */}
      {isClosed && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            P&L Breakdown
          </h2>
          <DetailRow
            label="Gross P&L"
            value={`${grossPnl >= 0 ? '+' : ''}${formatCurrency(grossPnl)}`}
            valueClassName={getPnlColor(grossPnl)}
          />
          <DetailRow
            label="Commission"
            value={trade.commission ? `-${formatCurrency(Number(trade.commission))}` : '$0.00'}
            valueClassName="text-muted-foreground"
          />
          <DetailRow
            label="Swap"
            value={trade.swap ? formatCurrency(Number(trade.swap)) : '$0.00'}
            valueClassName="text-muted-foreground"
          />
          <DetailRow
            label="Net P&L"
            value={`${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}`}
            valueClassName={`font-bold ${getPnlColor(pnl)}`}
          />
          {rMultiple !== null && (
            <DetailRow
              label="R-Multiple"
              value={`${rMultiple >= 0 ? '+' : ''}${rMultiple.toFixed(2)}R`}
              valueClassName={getPnlColor(rMultiple)}
            />
          )}
          {trade.riskAmount && (
            <DetailRow
              label="Risk Amount"
              value={formatCurrency(Number(trade.riskAmount))}
            />
          )}
        </div>
      )}

      {/* Psychology */}
      {(trade.emotionTag || trade.checklistPassed !== null || trade.aiScore) && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Psychology
          </h2>
          {trade.emotionTag && (
            <DetailRow label="Emotion" value={trade.emotionTag} />
          )}
          {trade.checklistPassed !== null && (
            <DetailRow
              label="Checklist"
              value={trade.checklistPassed ? '✓ Passed' : '✗ Failed'}
              valueClassName={trade.checklistPassed ? 'text-emerald-500' : 'text-red-500'}
            />
          )}
          {trade.aiScore !== null && (
            <DetailRow label="AI Score" value={`${trade.aiScore}/100`} />
          )}
        </div>
      )}

      {/* Notes */}
      {trade.notes && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
            Notes
          </h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{trade.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button asChild variant="outline" className="flex-1">
          <Link href={`/trades/${trade.id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit Trade
          </Link>
        </Button>
        <TradeDeleteButton tradeId={trade.id} symbol={trade.symbol} />
      </div>
    </div>
  )
}