//src/components/calendar/calendar-view.tsx

'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Calendar, ArrowUpRight, ArrowDownRight, Clock, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getCalendarData, getTradesForDate } from '@/actions/calendar'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Trade } from '@/types/trade'

type DayData = { date: string; pnl: number; count: number; winRate: number }

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatDuration(minutes: number | null) {
  if (!minutes) return '—'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function CalendarView() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [data, setData] = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<DayData | null>(null)
  const [dayTrades, setDayTrades] = useState<Trade[]>([])
  const [tradesLoading, setTradesLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setSelected(null)
    setDayTrades([])
    getCalendarData(year, month).then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [year, month])

  async function handleDayClick(dayData: DayData | null, dateStr: string) {
    if (!dayData) { setSelected(null); setDayTrades([]); return }
    if (selected?.date === dateStr) { setSelected(null); setDayTrades([]); return }
    setSelected(dayData)
    setTradesLoading(true)
    const trades = await getTradesForDate(dateStr)
    setDayTrades(trades as Trade[])
    setTradesLoading(false)
  }

  function prev() {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }

  function next() {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' })
  const dayMap = new Map(data.map(d => [d.date, d]))

  const totalPnl = data.reduce((sum, d) => sum + d.pnl, 0)
  const tradingDays = data.length
  const winDays = data.filter(d => d.pnl > 0).length
  const lossDays = data.filter(d => d.pnl < 0).length
  const bestDay = data.reduce((best, d) => d.pnl > (best?.pnl ?? -Infinity) ? d : best, null as DayData | null)
  const worstDay = data.reduce((worst, d) => d.pnl < (worst?.pnl ?? Infinity) ? d : worst, null as DayData | null)
  const avgPnl = tradingDays > 0 ? totalPnl / tradingDays : 0
  const winRate = tradingDays > 0 ? Math.round((winDays / tradingDays) * 100) : 0

  const totalRows = Math.ceil((firstDay + daysInMonth) / 7)
  const weeks = Array.from({ length: totalRows }, (_, row) => {
    const days: (number | null)[] = []
    let weekPnl = 0, weekTrades = 0
    for (let col = 0; col < 7; col++) {
      const day = row * 7 + col - firstDay + 1
      if (day < 1 || day > daysInMonth) { days.push(null); continue }
      days.push(day)
      const d = dayMap.get(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
      if (d) { weekPnl += d.pnl; weekTrades += d.count }
    }
    return { days, pnl: weekPnl, trades: weekTrades }
  })

  const todayStr = today.toISOString().split('T')[0]

  return (
    <div className="space-y-4">

      {/* Monthly Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="md:col-span-2 bg-card border border-border rounded-xl p-4 flex flex-col justify-between shadow-card">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Monthly P&L</p>
          <p className={cn('text-3xl font-bold mt-2 tabular-nums', totalPnl >= 0 ? 'text-emerald-500' : 'text-red-500')}>
            {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">{tradingDays} trading days</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-card">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Win Rate</p>
          <p className={cn('text-2xl font-bold mt-2', winRate >= 50 ? 'text-emerald-500' : 'text-red-500')}>{winRate}%</p>
          <p className="text-xs text-muted-foreground mt-1">{winDays}W / {lossDays}L</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-card">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Avg / Day</p>
          <p className={cn('text-2xl font-bold mt-2 tabular-nums', avgPnl >= 0 ? 'text-emerald-500' : 'text-red-500')}>
            {avgPnl >= 0 ? '+' : ''}{formatCurrency(avgPnl)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">per trading day</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-card">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
            <TrendingUp className="h-3 w-3 text-emerald-500" /> Best Day
          </p>
          <p className="text-2xl font-bold mt-2 text-emerald-500 tabular-nums">
            {bestDay ? `+${formatCurrency(bestDay.pnl)}` : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {bestDay ? new Date(bestDay.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'no data'}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 shadow-card">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-red-500" /> Worst Day
          </p>
          <p className="text-2xl font-bold mt-2 text-red-500 tabular-nums">
            {worstDay && worstDay.pnl < 0 ? formatCurrency(worstDay.pnl) : '—'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {worstDay && worstDay.pnl < 0 ? new Date(worstDay.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'no data'}
          </p>
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <Button variant="outline" size="icon" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
          <h2 className="text-lg font-bold">{monthName} {year}</h2>
          <Button variant="outline" size="icon" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
        </div>

        <div className="grid border-b border-border" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 88px' }}>
          {DAYS.map(d => (
            <div key={d} className="text-center text-xs text-muted-foreground font-semibold uppercase tracking-wide py-2.5">{d}</div>
          ))}
          <div className="text-center text-xs text-muted-foreground font-semibold uppercase tracking-wide py-2.5 border-l border-border">Week</div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">Loading...</div>
        ) : (
          <div className="divide-y divide-border">
            {weeks.map((week, rowIdx) => (
              <div key={rowIdx} className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr 1fr 88px' }}>
                {week.days.map((day, colIdx) => {
                  if (day === null) return <div key={colIdx} className="h-20 border-r border-border/50 bg-muted/20" />
                  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const dayData = dayMap.get(dateStr)
                  const isToday = dateStr === todayStr
                  const isSelected = selected?.date === dateStr

                  return (
                    <button
                      key={colIdx}
                      onClick={() => handleDayClick(dayData ?? null, dateStr)}
                      className={cn(
                        'h-20 border-r border-border/50 flex flex-col p-2.5 text-left transition-all relative',
                        'hover:brightness-95 dark:hover:brightness-110',
                        isSelected && 'ring-2 ring-inset ring-primary z-10',
                        dayData
                          ? dayData.pnl > 0 ? 'bg-emerald-500/15 dark:bg-emerald-500/10' : 'bg-red-500/15 dark:bg-red-500/10'
                          : 'hover:bg-muted/40'
                      )}
                    >
                      <span className={cn(
                        'text-sm font-semibold leading-none',
                        isToday
                          ? 'flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs'
                          : dayData
                            ? dayData.pnl > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                            : 'text-muted-foreground'
                      )}>{day}</span>
                      {dayData && (
                        <>
                          <span className={cn('mt-auto text-base font-bold tabular-nums', dayData.pnl > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                            {dayData.pnl >= 0 ? '+' : ''}{formatCurrency(dayData.pnl)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{dayData.count} trade{dayData.count !== 1 ? 's' : ''}</span>
                        </>
                      )}
                    </button>
                  )
                })}
                <div className={cn(
                  'h-20 border-l border-border flex flex-col items-center justify-center gap-0.5 px-2',
                  week.trades > 0 ? week.pnl >= 0 ? 'bg-emerald-500/8 dark:bg-emerald-500/5' : 'bg-red-500/8 dark:bg-red-500/5' : 'bg-muted/10'
                )}>
                  {week.trades > 0 ? (
                    <>
                      <span className={cn('text-sm font-bold tabular-nums', week.pnl >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                        {week.pnl >= 0 ? '+' : ''}{formatCurrency(week.pnl)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{week.trades} trades</span>
                    </>
                  ) : (
                    <span className="text-[10px] text-muted-foreground">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Day Detail Panel */}
      {selected && (
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          {/* Header + summary */}
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-semibold">
              {new Date(selected.date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
              })}
            </h3>
          </div>

          <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Net P&L</p>
              <p className={cn('text-2xl font-bold mt-1 tabular-nums', selected.pnl >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                {selected.pnl >= 0 ? '+' : ''}{formatCurrency(selected.pnl)}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Trades</p>
              <p className="text-2xl font-bold mt-1">{selected.count}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Win Rate</p>
              <p className={cn('text-2xl font-bold mt-1', selected.winRate >= 50 ? 'text-emerald-500' : 'text-red-500')}>
                {selected.winRate}%
              </p>
            </div>
          </div>

          {/* Trade list */}
          {tradesLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
              Loading trades...
            </div>
          ) : dayTrades.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
              No trades found for this day.
            </div>
          ) : (
            <div>
              {/* Column headers */}
              <div
                className="grid px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 border-b border-border"
                style={{ gridTemplateColumns: '140px 80px 70px 100px 100px 100px 70px 90px 40px' }}
              >
                <span>Symbol</span>
                <span>Direction</span>
                <span>Lots</span>
                <span>Entry</span>
                <span>Exit</span>
                <span>Net P&L</span>
                <span>R</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Duration</span>
                <span></span>
              </div>

              <div className="divide-y divide-border">
                {dayTrades.map((trade) => {
                  const pnl = Number(trade.netPnl ?? 0)
                  const isWin = pnl > 0

                  return (
                    <div
                      key={trade.id}
                      className="grid items-center px-5 py-3 hover:bg-muted/20 transition-colors text-sm"
                      style={{ gridTemplateColumns: '140px 80px 70px 100px 100px 100px 70px 90px 40px' }}
                    >
                      {/* Symbol */}
                      <div className="flex items-center gap-2">
                        <div className={cn('w-1 h-7 rounded-full flex-shrink-0', isWin ? 'bg-emerald-500' : 'bg-red-500')} />
                        <span className="font-semibold">{trade.symbol}</span>
                      </div>

                      {/* Direction */}
                      <Badge variant="outline" className={cn(
                        'text-[10px] font-semibold w-fit px-1.5',
                        trade.direction === 'LONG'
                          ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                          : 'border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/5'
                      )}>
                        {trade.direction === 'LONG'
                          ? <><ArrowUpRight className="h-2.5 w-2.5 inline mr-0.5" />LONG</>
                          : <><ArrowDownRight className="h-2.5 w-2.5 inline mr-0.5" />SHORT</>}
                      </Badge>

                      {/* Lots */}
                      <span className="text-muted-foreground tabular-nums">{trade.lotSize}</span>

                      {/* Entry */}
                      <span className="tabular-nums font-mono text-xs">{Number(trade.entryPrice).toFixed(5)}</span>

                      {/* Exit */}
                      <span className="tabular-nums font-mono text-xs text-muted-foreground">
                        {trade.exitPrice ? Number(trade.exitPrice).toFixed(5) : '—'}
                      </span>

                      {/* P&L */}
                      <span className={cn('font-bold tabular-nums', isWin ? 'text-emerald-500' : 'text-red-500')}>
                        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                      </span>

                      {/* R */}
                      <span className={cn('tabular-nums text-xs', trade.rMultiple
                        ? Number(trade.rMultiple) >= 0 ? 'text-emerald-500' : 'text-red-500'
                        : 'text-muted-foreground')}>
                        {trade.rMultiple ? `${Number(trade.rMultiple) >= 0 ? '+' : ''}${Number(trade.rMultiple).toFixed(2)}R` : '—'}
                      </span>

                      {/* Duration */}
                      <span className="text-muted-foreground text-xs">{formatDuration(trade.durationMinutes)}</span>

                      {/* Link */}
                      <Link href={`/trades/${trade.id}`}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}