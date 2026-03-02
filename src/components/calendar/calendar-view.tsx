//src/components/calendar/calendar-view.tsx

'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getCalendarData } from '@/actions/calendar'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

type DayData = { date: string; pnl: number; count: number; winRate: number }

export function CalendarView() {
  const today = new Date()
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth() + 1)
  const [data, setData] = useState<DayData[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<DayData | null>(null)

  useEffect(() => {
    setLoading(true)
    getCalendarData(year, month).then((d) => {
      setData(d)
      setLoading(false)
    })
  }, [year, month])

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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="icon" onClick={prev}><ChevronLeft className="h-4 w-4" /></Button>
          <div className="text-center">
            <h2 className="text-xl font-bold">{monthName} {year}</h2>
            <div className="flex items-center gap-4 mt-1 text-sm">
              <span className="text-muted-foreground">{tradingDays} trading days</span>
              <span className={totalPnl >= 0 ? 'text-emerald-500 font-semibold' : 'text-red-500 font-semibold'}>
                {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
              </span>
              {tradingDays > 0 && (
                <span className="text-muted-foreground">{Math.round((winDays / tradingDays) * 100)}% win days</span>
              )}
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={next}><ChevronRight className="h-4 w-4" /></Button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="text-center text-xs text-muted-foreground font-medium py-2">{d}</div>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}

          {/* Day cells */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const dayData = dayMap.get(dateStr)
            const isToday = dateStr === today.toISOString().split('T')[0]

            return (
              <button
                key={day}
                onClick={() => setSelected(dayData ?? null)}
                className={cn(
                  'aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all',
                  'hover:ring-2 hover:ring-primary/50',
                  isToday && 'ring-2 ring-primary',
                  dayData
                    ? dayData.pnl > 0
                      ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                    : 'text-muted-foreground hover:bg-muted'
                )}
              >
                <span className="font-medium">{day}</span>
                {dayData && (
                  <span className="text-[9px] font-semibold">
                    {dayData.pnl >= 0 ? '+' : ''}{Math.round(dayData.pnl)}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Day detail */}
      {selected && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-3">{new Date(selected.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Net P&L</p>
              <p className={`text-xl font-bold mt-1 ${selected.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {selected.pnl >= 0 ? '+' : ''}{formatCurrency(selected.pnl)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Trades</p>
              <p className="text-xl font-bold mt-1">{selected.count}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Win Rate</p>
              <p className={`text-xl font-bold mt-1 ${selected.winRate >= 50 ? 'text-emerald-500' : 'text-red-500'}`}>
                {selected.winRate}%
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}