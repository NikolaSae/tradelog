// src/components/analytics/pnl-by-day-chart.tsx
'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface DayData {
  day: string
  pnl: number
  trades: number
  winRate: number
}

export function PnlByDayChart({ data }: { data: DayData[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => v.slice(0, 3)}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
          width={50}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload as DayData
            return (
              <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm space-y-1">
                <p className="font-semibold">{label}</p>
                <p className={d.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                  {d.pnl >= 0 ? '+' : ''}{formatCurrency(d.pnl)}
                </p>
                <p className="text-muted-foreground">{d.trades} trades · {d.winRate}% WR</p>
              </div>
            )
          }}
        />
        <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={48}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} opacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}