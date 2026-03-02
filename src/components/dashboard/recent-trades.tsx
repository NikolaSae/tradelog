//src/components/dashboard/recent-trades.tsx


import Link from 'next/link'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { formatCurrency, getPnlColor } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface RecentTrade {
  id: string
  symbol: string
  direction: 'LONG' | 'SHORT'
  status: string
  netPnl: string | null
  rMultiple: string | null
  openedAt: Date
  lotSize: string
}

interface RecentTradesProps {
  trades: RecentTrade[]
}

export function RecentTrades({ trades }: RecentTradesProps) {
  if (trades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-muted-foreground text-sm">No recent trades</p>
        <Button variant="link" size="sm" asChild className="mt-1">
          <Link href="/trades/new">Add your first trade</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {trades.map((trade) => {
        const pnl = Number(trade.netPnl ?? 0)
        const hasResult = trade.status !== 'OPEN' && trade.netPnl !== null

        return (
          <Link
            key={trade.id}
            href={`/trades/${trade.id}`}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            {/* Direction icon */}
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
              trade.direction === 'LONG' ? 'bg-emerald-500/10' : 'bg-red-500/10'
            }`}>
              {trade.direction === 'LONG'
                ? <TrendingUp className="h-4 w-4 text-emerald-500" />
                : <TrendingDown className="h-4 w-4 text-red-500" />}
            </div>

            {/* Symbol & date */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{trade.symbol}</span>
                <Badge
                  variant="outline"
                  className={`text-xs px-1.5 py-0 ${
                    trade.direction === 'LONG'
                      ? 'border-emerald-500/30 text-emerald-500'
                      : 'border-red-500/30 text-red-500'
                  }`}
                >
                  {trade.direction}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {new Date(trade.openedAt).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                })}
                {' · '}{Number(trade.lotSize).toFixed(2)} lots
              </p>
            </div>

            {/* P&L */}
            <div className="text-right shrink-0">
              {hasResult ? (
                <>
                  <p className={`text-sm font-semibold ${getPnlColor(pnl)}`}>
                    {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                  </p>
                  {trade.rMultiple && (
                    <p className={`text-xs ${getPnlColor(Number(trade.rMultiple))}`}>
                      {Number(trade.rMultiple) >= 0 ? '+' : ''}{Number(trade.rMultiple).toFixed(2)}R
                    </p>
                  )}
                </>
              ) : (
                <Badge variant="outline" className="border-blue-500/30 text-blue-500 text-xs">
                  OPEN
                </Badge>
              )}
            </div>

            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
          </Link>
        )
      })}

      <div className="pt-2 border-t border-border">
        <Button variant="ghost" size="sm" asChild className="w-full text-muted-foreground">
          <Link href="/trades">View all trades</Link>
        </Button>
      </div>
    </div>
  )
}