//src/app/(dashboard)/trades/[id]/page.tsx

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, TrendingDown, Clock, Calendar, Tag, StickyNote, Edit } from 'lucide-react'
import { getTrade } from '@/actions/trades'
import { PageHeader } from '@/components/shared/page-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatCurrency, getPnlColor, getPnlBg, formatDuration } from '@/lib/utils'
import type { Metadata } from 'next'

interface TradeDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: TradeDetailPageProps): Promise<Metadata> {
  const { id } = await params
  const trade = await getTrade(id)
  if (!trade) return { title: 'Trade Not Found' }
  return { title: `${trade.symbol} ${trade.direction} — Trade Detail` }
}

export default async function TradeDetailPage({ params }: TradeDetailPageProps) {
  const { id } = await params
  const trade = await getTrade(id)

  if (!trade) notFound()

  const pnl = Number(trade.netPnl ?? 0)
  const grossPnl = Number(trade.grossPnl ?? 0)
  const commission = Number(trade.commission ?? 0)
  const swap = Number(trade.swap ?? 0)
  const isWin = pnl > 0
  const isOpen = trade.status === 'OPEN'

  const emotionEmoji: Record<string, string> = {
    CONFIDENT: '😎',
    FEARFUL: '😨',
    GREEDY: '🤑',
    NEUTRAL: '😐',
    REVENGE: '😤',
    FOMO: '😰',
    PATIENT: '🧘',
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/trades">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Trades
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`${trade.symbol}`}
        description={`Trade opened on ${new Date(trade.openedAt).toLocaleDateString('en-GB', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        })}`}
      >
        <Button variant="outline" size="sm" asChild>
          <Link href={`/trades/${id}/edit`}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Link>
        </Button>
      </PageHeader>

      {/* Top stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Net P&L */}
        <div className={`rounded-xl p-5 border ${isOpen ? 'bg-card border-border' : getPnlBg(pnl).includes('emerald') ? 'bg-emerald-500/10 border-emerald-500/20' : pnl < 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-card border-border'}`}>
          <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Net P&L</p>
          <p className={`text-2xl font-bold ${getPnlColor(pnl)}`}>
            {isOpen ? '—' : `${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}`}
          </p>
        </div>

        {/* Direction */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Direction</p>
          <div className="flex items-center gap-2">
            {trade.direction === 'LONG'
              ? <TrendingUp className="h-5 w-5 text-emerald-500" />
              : <TrendingDown className="h-5 w-5 text-red-500" />}
            <span className={`text-xl font-bold ${trade.direction === 'LONG' ? 'text-emerald-500' : 'text-red-500'}`}>
              {trade.direction}
            </span>
          </div>
        </div>

        {/* R-Multiple */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">R-Multiple</p>
          <p className={`text-2xl font-bold ${trade.rMultiple ? getPnlColor(Number(trade.rMultiple)) : 'text-muted-foreground'}`}>
            {trade.rMultiple
              ? `${Number(trade.rMultiple) >= 0 ? '+' : ''}${Number(trade.rMultiple).toFixed(2)}R`
              : '—'}
          </p>
        </div>

        {/* Duration */}
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Duration</p>
          <p className="text-2xl font-bold">
            {trade.durationMinutes ? formatDuration(trade.durationMinutes) : '—'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Trade Details */}
        <div className="md:col-span-2 space-y-4">
          {/* Price levels */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Price Levels</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Entry Price</p>
                <p className="font-mono font-semibold text-lg">{Number(trade.entryPrice).toFixed(5)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Exit Price</p>
                <p className="font-mono font-semibold text-lg">
                  {trade.exitPrice ? Number(trade.exitPrice).toFixed(5) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Stop Loss</p>
                <p className="font-mono text-red-400">
                  {trade.stopLoss ? Number(trade.stopLoss).toFixed(5) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Take Profit</p>
                <p className="font-mono text-emerald-400">
                  {trade.takeProfit ? Number(trade.takeProfit).toFixed(5) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* P&L Breakdown */}
          {!isOpen && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">P&L Breakdown</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Gross P&L</span>
                  <span className={`font-semibold ${getPnlColor(grossPnl)}`}>
                    {grossPnl >= 0 ? '+' : ''}{formatCurrency(grossPnl)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Commission</span>
                  <span className="text-red-400 font-medium">-{formatCurrency(commission)}</span>
                </div>
                {swap !== 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Swap</span>
                    <span className={`font-medium ${getPnlColor(swap)}`}>
                      {swap >= 0 ? '+' : ''}{formatCurrency(swap)}
                    </span>
                  </div>
                )}
                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <span className="text-sm font-semibold">Net P&L</span>
                  <span className={`font-bold text-lg ${getPnlColor(pnl)}`}>
                    {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Timing */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Timing</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Opened At</p>
                  <p className="text-sm font-medium">
                    {new Date(trade.openedAt).toLocaleString('en-GB', {
                      day: '2-digit', month: 'short', year: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
              {trade.closedAt && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Closed At</p>
                    <p className="text-sm font-medium">
                      {new Date(trade.closedAt).toLocaleString('en-GB', {
                        day: '2-digit', month: 'short', year: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              )}
              {trade.session && (
                <div className="flex items-start gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Session</p>
                    <p className="text-sm font-medium">{trade.session.replace('_', ' ')}</p>
                  </div>
                </div>
              )}
              <div className="flex items-start gap-3">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">Lot Size</p>
                  <p className="text-sm font-medium">{Number(trade.lotSize).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {trade.notes && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Notes</h2>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{trade.notes}</p>
            </div>
          )}
        </div>

        {/* Right: Meta */}
        <div className="space-y-4">
          {/* Status badges */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Status</h2>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={
                  trade.status === 'CLOSED' && isWin
                    ? 'border-emerald-500/30 text-emerald-500'
                    : trade.status === 'CLOSED' && !isWin
                    ? 'border-red-500/30 text-red-500'
                    : 'border-blue-500/30 text-blue-500'
                }
              >
                {trade.status}
              </Badge>
              <Badge
                variant="outline"
                className={trade.direction === 'LONG'
                  ? 'border-emerald-500/30 text-emerald-500'
                  : 'border-red-500/30 text-red-500'}
              >
                {trade.direction === 'LONG' ? '▲ Long' : '▼ Short'}
              </Badge>
            </div>
          </div>

          {/* Psychology */}
          {trade.emotionTag && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Psychology</h2>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{emotionEmoji[trade.emotionTag] ?? '😐'}</span>
                <span className="font-medium capitalize">{trade.emotionTag.toLowerCase()}</span>
              </div>
            </div>
          )}

          {/* Setup */}
          {trade.setupId && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Setup</h2>
              </div>
              <p className="text-sm font-mono">{trade.setupId}</p>
            </div>
          )}

          {/* AI Score placeholder */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-3">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">MAE / MFE</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">MAE</span>
                <span>{trade.mae ? formatCurrency(Number(trade.mae)) : '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">MFE</span>
                <span>{trade.mfe ? formatCurrency(Number(trade.mfe)) : '—'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}