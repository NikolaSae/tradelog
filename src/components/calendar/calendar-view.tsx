//src/components/calendar/calendar-view.tsx
'use client'

import { useState, useEffect, useTransition } from 'react'
import {
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  Calendar, ArrowUpRight, ArrowDownRight, Clock,
  ExternalLink, Plus, X, AlertTriangle, Bell, Trash2
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  getCalendarData, getTradesForDate,
  getCalendarEvents, createCalendarEvent, deleteCalendarEvent
} from '@/actions/calendar'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Trade } from '@/types/trade'

type DayData = { date: string; pnl: number; count: number; winRate: number }
type CalendarEvent = {
  id: string
  title: string
  description?: string | null
  date: string
  type: 'NEWS' | 'EARNINGS' | 'FOMC' | 'CPI' | 'NFP' | 'OTHER'
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const EVENT_TYPE_LABELS: Record<CalendarEvent['type'], string> = {
  NEWS: 'News', EARNINGS: 'Earnings', FOMC: 'FOMC',
  CPI: 'CPI', NFP: 'NFP', OTHER: 'Other',
}

const SEVERITY_COLORS: Record<CalendarEvent['severity'], string> = {
  LOW: 'border-blue-500/40 text-blue-500 bg-blue-500/8',
  MEDIUM: 'border-amber-500/40 text-amber-500 bg-amber-500/8',
  HIGH: 'border-red-500/40 text-red-600 bg-red-500/8',
}

const SEVERITY_DOT: Record<CalendarEvent['severity'], string> = {
  LOW: 'bg-blue-500',
  MEDIUM: 'bg-amber-500',
  HIGH: 'bg-red-500',
}

function formatDuration(minutes: number | null) {
  if (!minutes) return '—'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const EMPTY_FORM = {
  title: '', description: '', date: '', time: '', type: 'NEWS' as CalendarEvent['type'],
  severity: 'MEDIUM' as CalendarEvent['severity'],
}

export function CalendarView() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [data, setData] = useState<DayData[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<DayData | null>(null)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [dayTrades, setDayTrades] = useState<Trade[]>([])
  const [tradesLoading, setTradesLoading] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    setLoading(true)
    setSelected(null)
    setSelectedDate(null)
    setDayTrades([])
    Promise.all([
      getCalendarData(year, month),
      getCalendarEvents(year, month),
    ]).then(([d, e]) => {
      setData(d)
      setEvents(e as CalendarEvent[])
      setLoading(false)
    })
  }, [year, month])

  async function handleDayClick(dayData: DayData | null, dateStr: string) {
    if (selectedDate === dateStr) {
      setSelected(null); setSelectedDate(null); setDayTrades([]); return
    }
    setSelected(dayData)
    setSelectedDate(dateStr)
    if (dayData) {
      setTradesLoading(true)
      const trades = await getTradesForDate(dateStr)
      setDayTrades(trades as Trade[])
      setTradesLoading(false)
    } else {
      setDayTrades([])
    }
  }

  function openAddEvent(prefillDate?: string) {
    setForm({ ...EMPTY_FORM, date: prefillDate ?? '' })
    setFormError(null)
    setShowEventModal(true)
  }

  function handleSubmit() {
  setFormError(null)
  const trimmedTitle = form.title.trim()
  if (!trimmedTitle) { setFormError('Title is required.'); return }
  if (trimmedTitle.length > 100) { setFormError('Title is too long.'); return }
  if (!form.date.match(/^\d{4}-\d{2}-\d{2}$/)) { setFormError('Select a valid date.'); return }
  if (!['NEWS', 'EARNINGS', 'FOMC', 'CPI', 'NFP', 'OTHER'].includes(form.type)) {
    setFormError('Invalid event type.'); return
  }
  if (!['LOW', 'MEDIUM', 'HIGH'].includes(form.severity)) {
    setFormError('Invalid severity.'); return
  }

  startTransition(async () => {
    try {
      const event = await createCalendarEvent({ ...form, title: trimmedTitle })
      setEvents(prev => [...prev, event as CalendarEvent].sort((a, b) => a.date.localeCompare(b.date)))
      setShowEventModal(false)
      setForm(EMPTY_FORM)
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : 'Failed to create event.')
    }
  })
}

  function handleDelete(id: string) {
  startTransition(async () => {
    try {
      await deleteCalendarEvent({ id })
      setEvents(prev => prev.filter(e => e.id !== id))
    } catch {

      console.error('Failed to delete event:', id)
    }
  })
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
  const eventMap = new Map<string, CalendarEvent[]>()
  for (const e of events) {
    if (!eventMap.has(e.date)) eventMap.set(e.date, [])
    eventMap.get(e.date)!.push(e)
  }

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

function toLocalDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const todayStr = toLocalDateStr(today)
  const selectedDayEvents = selectedDate ? (eventMap.get(selectedDate) ?? []) : []

  // Upcoming events (next 7 days from today)
  const upcomingCutoff = new Date(today)
  upcomingCutoff.setDate(upcomingCutoff.getDate() + 7)
  const upcomingEvents = events
  .filter(e => e.date >= todayStr && e.date <= toLocalDateStr(upcomingCutoff))
    .sort((a, b) => a.date.localeCompare(b.date))

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

      {/* Upcoming Events Banner */}
      {upcomingEvents.length > 0 && (
  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-5 py-3 flex items-start gap-3">
    <Bell className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1.5">
        Upcoming — Next 7 Days
      </p>
      <div className="flex flex-wrap gap-2">
        {upcomingEvents.map(e => (
          <div key={e.id} className="flex items-center gap-1.5 text-xs">
            <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', SEVERITY_DOT[e.severity])} />
            <span className="font-medium">{e.title}</span>
            <span className="text-muted-foreground">
              {new Date(e.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              {e.time ? ` · ${e.time}` : ''}
            </span>
            <Badge variant="outline" className={cn('text-[9px] px-1 py-0', SEVERITY_COLORS[e.severity])}>
              {e.type}
            </Badge>
          </div>
        ))}
      </div>
    </div>
    <Button variant="outline" size="sm" className="flex-shrink-0 h-7 text-xs gap-1" onClick={() => openAddEvent()}>
      <Plus className="h-3 w-3" /> Add
    </Button>
  </div>
)}
            

      {/* Calendar */}
      <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <Button variant="outline" size="icon" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold">{monthName} {year}</h2>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openAddEvent()}>
              <Plus className="h-3 w-3" /> Add Event
            </Button>
          </div>
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
                  const dayEvents = eventMap.get(dateStr) ?? []
                  const isToday = dateStr === todayStr
                  const isSelected = selectedDate === dateStr
                  const highestSeverity = dayEvents.reduce<CalendarEvent['severity'] | null>((acc, e) => {
                    const order = { HIGH: 3, MEDIUM: 2, LOW: 1 }
                    if (!acc || order[e.severity] > order[acc]) return e.severity
                    return acc
                  }, null)

                  return (
                    <button
                      key={colIdx}
                      onClick={() => handleDayClick(dayData ?? null, dateStr)}
                      className={cn(
                        'h-20 border-r border-border/50 flex flex-col p-2 text-left transition-all relative',
                        'hover:brightness-95 dark:hover:brightness-110',
                        isSelected && 'ring-2 ring-inset ring-primary z-10',
                        dayData
                          ? dayData.pnl > 0 ? 'bg-emerald-500/15 dark:bg-emerald-500/10' : 'bg-red-500/15 dark:bg-red-500/10'
                          : 'hover:bg-muted/40'
                      )}
                    >
                      <div className="flex items-start justify-between w-full">
                        <span className={cn(
                          'text-sm font-semibold leading-none',
                          isToday
                            ? 'flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs'
                            : dayData
                              ? dayData.pnl > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'
                              : 'text-muted-foreground'
                        )}>{day}</span>

                        {/* Event severity dot */}
                        {highestSeverity && (
                          <span className={cn('w-1.5 h-1.5 rounded-full mt-0.5 flex-shrink-0', SEVERITY_DOT[highestSeverity])} />
                        )}
                      </div>

                      {/* Event pills — max 2 shown */}
                      {dayEvents.length > 0 && (
                        <div className="flex flex-col gap-0.5 mt-1 w-full overflow-hidden">
                          {dayEvents.slice(0, 2).map(e => (
                            <span
                              key={e.id}
                              className={cn(
                                'text-[9px] font-semibold px-1 rounded truncate border',
                                SEVERITY_COLORS[e.severity]
                              )}
                            >
                              {e.type} · {e.title}
                            </span>
                          ))}
                          {dayEvents.length > 2 && (
                            <span className="text-[9px] text-muted-foreground px-1">+{dayEvents.length - 2} more</span>
                          )}
                        </div>
                      )}

                      {dayData && (
                        <div className="mt-auto">
                          <span className={cn('text-sm font-bold tabular-nums block', dayData.pnl > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                            {dayData.pnl >= 0 ? '+' : ''}{formatCurrency(dayData.pnl)}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{dayData.count} trade{dayData.count !== 1 ? 's' : ''}</span>
                        </div>
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
      {selectedDate && (
        <div className="bg-card border border-border rounded-xl shadow-card overflow-hidden">
          <div className="flex items-center justify-between gap-2 px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-semibold">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                  weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
                })}
              </h3>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => openAddEvent(selectedDate)}>
              <Plus className="h-3 w-3" /> Add Event
            </Button>
          </div>

          {/* Day Events */}
          {selectedDayEvents.length > 0 && (
            <div className="px-5 py-3 border-b border-border bg-muted/20 flex flex-wrap gap-2">
              {selectedDayEvents.map(e => (
                <div key={e.id} className={cn('flex items-center gap-2 text-xs border rounded-lg px-2.5 py-1.5', SEVERITY_COLORS[e.severity])}>
                  <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold leading-tight">{e.title}</span>
                    {e.description && <span className="text-muted-foreground truncate max-w-48">{e.description}</span>}
                  </div>
                  <Badge variant="outline" className={cn('text-[9px] px-1 py-0 ml-1 flex-shrink-0', SEVERITY_COLORS[e.severity])}>
                    {EVENT_TYPE_LABELS[e.type]}
                  </Badge>
                  <button
                    onClick={() => handleDelete(e.id)}
                    disabled={isPending}
                    className="ml-1 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    aria-label="Delete event"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {selected && (
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
          )}

          {tradesLoading ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">Loading trades...</div>
          ) : dayTrades.length === 0 && selectedDayEvents.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
              No trades or events for this day.
            </div>
          ) : dayTrades.length > 0 ? (
            <div>
              <div
                className="grid px-5 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted/30 border-b border-border"
                style={{ gridTemplateColumns: '140px 80px 70px 100px 100px 100px 70px 90px 40px' }}
              >
                <span>Symbol</span><span>Direction</span><span>Lots</span>
                <span>Entry</span><span>Exit</span><span>Net P&L</span>
                <span>R</span><span className="flex items-center gap-1"><Clock className="h-3 w-3" />Duration</span>
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
                      <div className="flex items-center gap-2">
                        <div className={cn('w-1 h-7 rounded-full flex-shrink-0', isWin ? 'bg-emerald-500' : 'bg-red-500')} />
                        <span className="font-semibold">{trade.symbol}</span>
                      </div>
                      <Badge variant="outline" className={cn('text-[10px] font-semibold w-fit px-1.5',
                        trade.direction === 'LONG'
                          ? 'border-emerald-500/40 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5'
                          : 'border-red-500/40 text-red-600 dark:text-red-400 bg-red-500/5'
                      )}>
                        {trade.direction === 'LONG'
                          ? <><ArrowUpRight className="h-2.5 w-2.5 inline mr-0.5" />LONG</>
                          : <><ArrowDownRight className="h-2.5 w-2.5 inline mr-0.5" />SHORT</>}
                      </Badge>
                      <span className="text-muted-foreground tabular-nums">{trade.lotSize}</span>
                      <span className="tabular-nums font-mono text-xs">{Number(trade.entryPrice).toFixed(5)}</span>
                      <span className="tabular-nums font-mono text-xs text-muted-foreground">
                        {trade.exitPrice ? Number(trade.exitPrice).toFixed(5) : '—'}
                      </span>
                      <span className={cn('font-bold tabular-nums', isWin ? 'text-emerald-500' : 'text-red-500')}>
                        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                      </span>
                      <span className={cn('tabular-nums text-xs', trade.rMultiple
                        ? Number(trade.rMultiple) >= 0 ? 'text-emerald-500' : 'text-red-500'
                        : 'text-muted-foreground')}>
                        {trade.rMultiple ? `${Number(trade.rMultiple) >= 0 ? '+' : ''}${Number(trade.rMultiple).toFixed(2)}R` : '—'}
                      </span>
                      <span className="text-muted-foreground text-xs">{formatDuration(trade.durationMinutes)}</span>
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
          ) : null}
        </div>
      )}

      {/* Add Event Modal */}
      <Dialog open={showEventModal} onOpenChange={setShowEventModal}>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <Bell className="h-4 w-4" /> Add Calendar Event
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="evt-title">Title <span className="text-destructive">*</span></Label>
        <Input
          id="evt-title"
          placeholder="e.g. US CPI Release"
          maxLength={100}
          value={form.title}
          onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="evt-date">Date <span className="text-destructive">*</span></Label>
          <Input
            id="evt-date"
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="evt-time">
            Time <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            id="evt-time"
            type="time"
            value={form.time}
            onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select
            value={form.type}
            onValueChange={v => setForm(f => ({ ...f, type: v as CalendarEvent['type'] }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Severity</Label>
          <Select
            value={form.severity}
            onValueChange={v => setForm(f => ({ ...f, severity: v as CalendarEvent['severity'] }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="LOW">🔵 Low</SelectItem>
              <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
              <SelectItem value="HIGH">🔴 High</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="evt-desc">
          Description <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Textarea
          id="evt-desc"
          placeholder="Notes about this event..."
          maxLength={500}
          rows={3}
          value={form.description}
          onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
        />
      </div>

      {formError && (
        <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          <X className="h-3.5 w-3.5 flex-shrink-0" />
          {formError}
        </div>
      )}
    </div>

    <DialogFooter>
      <Button variant="outline" onClick={() => setShowEventModal(false)} disabled={isPending}>
        Cancel
      </Button>
      <Button onClick={handleSubmit} disabled={isPending}>
        {isPending ? 'Saving...' : 'Add Event'}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </div>
  )
}