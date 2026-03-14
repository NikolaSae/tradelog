//src/components/trades/trade-table.tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useRef } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency, getPnlColor } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/shared/empty-state'
import { TrendingUp } from 'lucide-react'
import { deleteTrade } from '@/actions/trades'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import type { Trade } from '@/types/trade'

interface TradeTableProps {
  trades: Trade[]
}

export function TradeTable({ trades }: TradeTableProps) {
  const router = useRouter()
  const deletingRef = useRef<string | null>(null)

  if (trades.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No trades yet"
        description="Start logging your trades to track your performance"
        action={{ label: 'Add your first trade', href: '/trades/new' }}
      />
    )
  }

  async function handleDelete(id: string, symbol: string) {
    if (deletingRef.current) return
    deletingRef.current = id

    try {
      const result = await deleteTrade(id)
      if (result.success) {
        toast.success(`${symbol} trade deleted`)
        router.refresh()
      } else {
        toast.error('Failed to delete trade.')
      }
    } catch {
      toast.error('Failed to delete trade.')
    } finally {
      deletingRef.current = null
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Date</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Symbol</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Direction</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Entry</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Exit</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Lots</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">Net P&L</th>
              <th className="text-right px-4 py-3 text-muted-foreground font-medium">R</th>
              <th className="text-left px-4 py-3 text-muted-foreground font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => {
              const pnl = Number(trade.netPnl ?? 0)
              const isWin = pnl > 0
              const isLoss = pnl < 0

              return (
                <tr
                  key={trade.id}
                  className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                >
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(trade.openedAt).toLocaleDateString('en-GB', {
                      day: '2-digit', month: 'short', year: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 font-medium">{trade.symbol}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={trade.direction === 'LONG'
                        ? 'border-emerald-500/30 text-emerald-500'
                        : 'border-red-500/30 text-red-500'}
                    >
                      {trade.direction === 'LONG' ? '▲ Long' : '▼ Short'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {Number(trade.entryPrice).toFixed(5)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs">
                    {trade.exitPrice ? Number(trade.exitPrice).toFixed(5) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {Number(trade.lotSize).toFixed(2)}
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold ${getPnlColor(pnl)}`}>
                    {trade.netPnl ? `${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}` : '—'}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono text-xs ${getPnlColor(pnl)}`}>
                    {trade.rMultiple
                      ? `${Number(trade.rMultiple) >= 0 ? '+' : ''}${Number(trade.rMultiple).toFixed(2)}R`
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={
                        trade.status === 'CLOSED' && isWin
                          ? 'border-emerald-500/30 text-emerald-500'
                          : trade.status === 'CLOSED' && isLoss
                          ? 'border-red-500/30 text-red-500'
                          : trade.status === 'OPEN'
                          ? 'border-blue-500/30 text-blue-500'
                          : 'border-border'
                      }
                    >
                      {trade.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/trades/${trade.id}`}>View</Link>
                      </Button>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/trades/${trade.id}/edit`}>Edit</Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete trade?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the <strong>{trade.symbol}</strong>{' '}
                              {trade.direction.toLowerCase()} trade from{' '}
                              {new Date(trade.openedAt).toLocaleDateString('en-GB', {
                                day: '2-digit', month: 'short', year: 'numeric',
                              })}. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => handleDelete(trade.id, trade.symbol)}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}