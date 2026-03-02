//src/components/dashboard/equity-curve.tsx

'use client'

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface EquityCurvePoint {
  date: string
  equity: number
  pnl: number
}

interface EquityCurveProps {
  data: EquityCurvePoint[]
  initialBalance?: number
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null

  const equity = payload[0]?.value as number
  const pnl = payload[0]?.payload?.pnl as number

  return (
    <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm">
      <p className="text-muted-foreground text-xs mb-1">{label}</p>
      <p className="font-semibold">{formatCurrency(equity)}</p>
      <p className={`text-xs font-medium ${pnl >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)} trade
      </p>
    </div>
  )
}

export function EquityCurve({ data, initialBalance = 10000 }: EquityCurveProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        Add trades to see your equity curve
      </div>
    )
  }

  const isPositive = data.length > 0
    ? data[data.length - 1].equity >= (data[0]?.equity ?? initialBalance)
    : true

  const color = isPositive ? '#10b981' : '#ef4444'
  const gradientId = `equity-gradient-${isPositive ? 'green' : 'red'}`

  const minEquity = Math.min(...data.map(d => d.equity))
  const maxEquity = Math.max(...data.map(d => d.equity))
  const padding = (maxEquity - minEquity) * 0.1 || 100

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.2} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          opacity={0.5}
        />

        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => {
            const d = new Date(v)
            return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
          }}
        />

        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `$${(v / 1000).toFixed(1)}k`}
          domain={[minEquity - padding, maxEquity + padding]}
          width={55}
        />

        <Tooltip content={<CustomTooltip />} />

        <Area
          type="monotone"
          dataKey="equity"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: 'hsl(var(--background))', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}