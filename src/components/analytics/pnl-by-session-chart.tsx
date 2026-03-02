// src/components/analytics/pnl-by-session-chart.tsx
'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface SessionData {
  session: string
  pnl: number
  trades: number
  winRate: number
}

function formatSession(s: string) {
  return s.replace('_', ' ').replace('OVERLAP_LONDON_NY', 'LDN/NY').replace('NEW_YORK', 'New York')
}

export function PnlBySessionChart({ data }: { data: SessionData[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
        <XAxis
          dataKey="session"
          tickFormatter={formatSession}
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v}`}
          width={50}
        />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null
            const d = payload[0].payload as SessionData
            return (
              <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm space-y-1">
                <p className="font-semibold">{formatSession(d.session)}</p>
                <p className={d.pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                  {d.pnl >= 0 ? '+' : ''}{formatCurrency(d.pnl)}
                </p>
                <p className="text-muted-foreground">{d.trades} trades · {d.winRate}% WR</p>
              </div>
            )
          }}
        />
        <Bar dataKey="pnl" radius={[4, 4, 0, 0]} maxBarSize={64}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} opacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}