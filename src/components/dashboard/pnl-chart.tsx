//src/components/dashboard/pnl-chart.tsx

'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface PnlDataPoint {
  date: string
  pnl: number
}

interface PnlChartProps {
  data: PnlDataPoint[]
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const pnl = payload[0]?.value as number

  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className={`font-semibold ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
      </p>
    </div>
  )
}

export function PnlChart({ data }: PnlChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No P&L data available
      </div>
    )
  }

  const maxAbs = Math.max(...data.map(d => Math.abs(d.pnl)))
  const padding = maxAbs * 0.15 || 50

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          opacity={0.5}
          vertical={false}
        />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => {
          const [year, month, day] = (v as string).split('-').map(Number)
          const d = new Date(year, month - 1, day)
          return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${v >= 0 ? '' : '-'}${Math.abs(v / 1000).toFixed(1)}k`}
          domain={[-maxAbs - padding, maxAbs + padding]}
          width={55}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={40}>
          {data.map((entry, index) => (
            <Cell
              key={index}
              fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'}
              opacity={0.85}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}