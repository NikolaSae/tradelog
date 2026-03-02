//src/components/trades/trade-filters.tsx

'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function TradeFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const period = searchParams.get('period') ?? 'month'
  const direction = searchParams.get('direction') ?? ''
  const status = searchParams.get('status') ?? ''
  const symbol = searchParams.get('symbol') ?? ''

  const setParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) params.set(key, value)
      else params.delete(key)
      router.push(`${pathname}?${params.toString()}`)
    },
    [searchParams, pathname, router]
  )

  const hasFilters = !!(direction || status || symbol || period !== 'month')

  function clearAll() {
    router.push(pathname)
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Symbol search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder="Symbol..."
          className="pl-8 w-32 h-9 text-sm uppercase"
          defaultValue={symbol}
          onChange={(e) => setParam('symbol', e.target.value.toUpperCase())}
        />
      </div>

      {/* Period */}
      <Select value={period} onValueChange={(v) => setParam('period', v)}>
        <SelectTrigger className="h-9 w-36 text-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="day">Today</SelectItem>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
          <SelectItem value="quarter">Quarter</SelectItem>
          <SelectItem value="year">This Year</SelectItem>
          <SelectItem value="all">All Time</SelectItem>
        </SelectContent>
      </Select>

      {/* Direction */}
      <Select
        value={direction || 'all'}
        onValueChange={(v) => setParam('direction', v === 'all' ? '' : v)}
      >
        <SelectTrigger className="h-9 w-32 text-sm">
          <SelectValue placeholder="Direction" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Directions</SelectItem>
          <SelectItem value="LONG">▲ Long</SelectItem>
          <SelectItem value="SHORT">▼ Short</SelectItem>
        </SelectContent>
      </Select>

      {/* Status */}
      <Select
        value={status || 'all'}
        onValueChange={(v) => setParam('status', v === 'all' ? '' : v)}
      >
        <SelectTrigger className="h-9 w-32 text-sm">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="CLOSED">Closed</SelectItem>
          <SelectItem value="OPEN">Open</SelectItem>
          <SelectItem value="BREAKEVEN">Breakeven</SelectItem>
          <SelectItem value="PARTIALLY_CLOSED">Partial</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear filters */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAll}
          className="h-9 text-muted-foreground hover:text-foreground"
        >
          <X className="h-3.5 w-3.5 mr-1" />
          Clear
        </Button>
      )}

      {/* Results count slot — populated by parent if needed */}
    </div>
  )
}