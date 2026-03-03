//src/components/leaderboard/leaderboard-table.tsx

'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ArrowUp, ArrowDown, ArrowUpDown, Medal, Crown } from 'lucide-react'
import { formatCurrency, getPnlColor, cn } from '@/lib/utils'
import type { LeaderboardEntry, LeaderboardSortKey, LeaderboardSortDir } from '@/actions/leaderboard'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  currentUserId: string
  sortBy: LeaderboardSortKey
  sortDir: LeaderboardSortDir
}

const COLUMNS: {
  key: LeaderboardSortKey
  label: string
  format: (e: LeaderboardEntry) => string
  className?: string
  valueClassName?: (e: LeaderboardEntry) => string
}[] = [
  {
    key: 'equity',
    label: 'Equity',
    format: e => `${e.equity >= 0 ? '+' : ''}${formatCurrency(e.equity)}`,
    valueClassName: e => getPnlColor(e.equity),
  },
  {
    key: 'growthPercent',
    label: 'Growth %',
    format: e => `${e.growthPercent >= 0 ? '+' : ''}${e.growthPercent.toFixed(2)}%`,
    valueClassName: e => getPnlColor(e.growthPercent),
  },
  {
    key: 'winRate',
    label: 'Win Rate',
    format: e => `${e.winRate}%`,
    valueClassName: e => e.winRate >= 50 ? 'text-emerald-500' : 'text-red-500',
  },
  {
    key: 'totalTrades',
    label: 'Trades',
    format: e => e.totalTrades.toString(),
  },
  {
    key: 'profitFactor',
    label: 'PF',
    format: e => e.profitFactor.toFixed(2),
    valueClassName: e => e.profitFactor >= 1 ? 'text-emerald-500' : 'text-red-500',
  },
  {
    key: 'expectancy',
    label: 'Expectancy',
    format: e => `${e.expectancy >= 0 ? '+' : ''}${formatCurrency(e.expectancy)}`,
    valueClassName: e => getPnlColor(e.expectancy),
  },
  {
    key: 'avgRMultiple',
    label: 'Avg R',
    format: e => e.avgRMultiple !== 0 ? `${e.avgRMultiple >= 0 ? '+' : ''}${e.avgRMultiple.toFixed(2)}R` : '—',
    valueClassName: e => getPnlColor(e.avgRMultiple),
  },
  {
    key: 'totalNetPnl',
    label: 'Net P&L',
    format: e => `${e.totalNetPnl >= 0 ? '+' : ''}${formatCurrency(e.totalNetPnl)}`,
    valueClassName: e => getPnlColor(e.totalNetPnl),
  },
]

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-7 h-7 bg-yellow-500/20 rounded-full flex items-center justify-center">
      <Crown className="h-3.5 w-3.5 text-yellow-500" />
    </div>
  )
  if (rank === 2) return (
    <div className="w-7 h-7 bg-zinc-400/20 rounded-full flex items-center justify-center">
      <Medal className="h-3.5 w-3.5 text-zinc-400" />
    </div>
  )
  if (rank === 3) return (
    <div className="w-7 h-7 bg-amber-700/20 rounded-full flex items-center justify-center">
      <Medal className="h-3.5 w-3.5 text-amber-700" />
    </div>
  )
  return (
    <div className="w-7 h-7 flex items-center justify-center">
      <span className="text-sm font-medium text-muted-foreground">{rank}</span>
    </div>
  )
}

export function LeaderboardTable({
  entries,
  currentUserId,
  sortBy,
  sortDir,
}: LeaderboardTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleSort(key: LeaderboardSortKey) {
    const params = new URLSearchParams(searchParams.toString())
    if (sortBy === key) {
      // Toggle direction
      params.set('dir', sortDir === 'desc' ? 'asc' : 'desc')
    } else {
      params.set('sort', key)
      params.set('dir', 'desc')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  function SortIcon({ col }: { col: LeaderboardSortKey }) {
    if (sortBy !== col) return <ArrowUpDown className="h-3 w-3 text-muted-foreground/50" />
    if (sortDir === 'desc') return <ArrowDown className="h-3 w-3 text-primary" />
    return <ArrowUp className="h-3 w-3 text-primary" />
  }

  if (entries.length === 0) {
    return (
      <div className="bg-card border border-border rounded-xl p-16 text-center">
        <p className="text-muted-foreground">No traders on the leaderboard yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          Add some trades to appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              {/* Rank */}
              <th className="px-4 py-3 text-left w-10">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">#</span>
              </th>

              {/* Trader */}
              <th className="px-4 py-3 text-left min-w-[160px]">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Trader
                </span>
              </th>

              {/* W/L */}
              <th className="px-4 py-3 text-center hidden md:table-cell">
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  W/L
                </span>
              </th>

              {/* Sortable columns */}
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-right cursor-pointer hover:bg-muted/50 transition-colors select-none whitespace-nowrap"
                  onClick={() => handleSort(col.key)}
                >
                  <div className="flex items-center justify-end gap-1.5">
                    <span className={cn(
                      'text-xs font-medium uppercase tracking-wider',
                      sortBy === col.key ? 'text-primary' : 'text-muted-foreground'
                    )}>
                      {col.label}
                    </span>
                    <SortIcon col={col.key} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-border/50">
            {entries.map(entry => {
              const isCurrentUser = entry.userId === currentUserId
              return (
                <tr
                  key={entry.userId}
                  className={cn(
                    'transition-colors',
                    isCurrentUser
                      ? 'bg-primary/5 hover:bg-primary/8'
                      : 'hover:bg-muted/20'
                  )}
                >
                  {/* Rank */}
                  <td className="px-4 py-3">
                    <RankBadge rank={entry.rank} />
                  </td>

                  {/* Trader info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* Avatar */}
                      <div className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                        isCurrentUser
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}>
                        {entry.nickname.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-sm truncate">{entry.nickname}</p>
                          {isCurrentUser && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium shrink-0">
                              You
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {entry.maskedEmail}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* W/L */}
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-xs">
                      <span className="text-emerald-500 font-medium">{entry.winningTrades}W</span>
                      <span className="text-muted-foreground mx-1">/</span>
                      <span className="text-red-500 font-medium">{entry.losingTrades}L</span>
                    </span>
                  </td>

                  {/* Sortable columns */}
                  {COLUMNS.map(col => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-right font-medium text-sm',
                        sortBy === col.key && 'bg-primary/3',
                        col.valueClassName ? col.valueClassName(entry) : ''
                      )}
                    >
                      {col.format(entry)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="border-t border-border/50 px-4 py-3 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {entries.length} traders · Sorted by {sortBy} ({sortDir})
        </p>
        <p className="text-xs text-muted-foreground">
          Emails are masked for privacy
        </p>
      </div>
    </div>
  )
}