// src/components/analytics/direction-stats.tsx
import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface DirectionStatsProps {
  data: {
    long: { trades: number; pnl: number; winRate: number }
    short: { trades: number; pnl: number; winRate: number }
  }
}

export function DirectionStats({ data }: DirectionStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Long */}
      <div className="bg-card border border-emerald-500/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </div>
          <span className="font-semibold text-emerald-500">Long</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Trades</span>
            <span className="font-medium">{data.long.trades}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Net P&L</span>
            <span className={`font-semibold ${data.long.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {data.long.pnl >= 0 ? '+' : ''}{formatCurrency(data.long.pnl)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Win Rate</span>
            <span className="font-medium">{data.long.winRate}%</span>
          </div>
        </div>
      </div>

      {/* Short */}
      <div className="bg-card border border-red-500/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center">
            <TrendingDown className="h-4 w-4 text-red-500" />
          </div>
          <span className="font-semibold text-red-500">Short</span>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Trades</span>
            <span className="font-medium">{data.short.trades}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Net P&L</span>
            <span className={`font-semibold ${data.short.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {data.short.pnl >= 0 ? '+' : ''}{formatCurrency(data.short.pnl)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Win Rate</span>
            <span className="font-medium">{data.short.winRate}%</span>
          </div>
        </div>
      </div>
    </div>
  )
}