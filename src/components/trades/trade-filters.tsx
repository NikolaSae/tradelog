//src/components/trades/trade-filters.tsx

'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { TimePeriod } from '@/types/trade'

const PERIODS: { value: TimePeriod; label: string }[] = [
  { value: 'all', label: 'All time' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'quarter', label: 'This quarter' },
  { value: 'year', label: 'This year' },
]

interface TradeFiltersProps {
  symbols: string[]
  currentPeriod: TimePeriod
  currentSymbol?: string
  currentDirection?: string
  currentStatus?: string
}

export function TradeFilters({
  symbols,
  currentPeriod,
  currentSymbol,
  currentDirection,
  currentStatus,
}: TradeFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    // Reset na stranu 1 kad se filter mijenja
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }, [searchParams, pathname, router])

  const hasActiveFilters = currentPeriod !== 'all' || currentSymbol || currentDirection || currentStatus

  function clearAll() {
    router.push(pathname)
  }

  return (
    <div className="space-y-3">
      {/* Period filter */}
      <div className="flex items-center gap-2 flex-wrap">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setParam('period', p.value === 'all' ? null : p.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
              currentPeriod === p.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-muted/50'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Secondary filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Symbol */}
        <select
          value={currentSymbol ?? ''}
          onChange={e => setParam('symbol', e.target.value || null)}
          className="h-8 px-2 rounded-lg border border-border bg-background text-sm min-w-[110px]"
        >
          <option value="">All symbols</option>
          {symbols.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Direction */}
        <select
          value={currentDirection ?? ''}
          onChange={e => setParam('direction', e.target.value || null)}
          className="h-8 px-2 rounded-lg border border-border bg-background text-sm min-w-[110px]"
        >
          <option value="">All directions</option>
          <option value="LONG">Long</option>
          <option value="SHORT">Short</option>
        </select>

        {/* Status */}
        <select
          value={currentStatus ?? ''}
          onChange={e => setParam('status', e.target.value || null)}
          className="h-8 px-2 rounded-lg border border-border bg-background text-sm min-w-[110px]"
        >
          <option value="">All statuses</option>
          <option value="CLOSED">Closed</option>
          <option value="OPEN">Open</option>
          <option value="BREAKEVEN">Breakeven</option>
        </select>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAll}
            className="h-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}