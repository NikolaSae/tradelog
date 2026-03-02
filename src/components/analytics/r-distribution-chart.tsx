// src/components/analytics/r-distribution-chart.tsx
'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Cell, ResponsiveContainer,
} from 'recharts'

interface RBucket {
  label: string
  count: number
}

export function RDistributionChart({ data }: { data: RBucket[] }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          tickLine={false}
          axisLine={false}
          allowDecimals={false}
          width={30}
        />
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null
            return (
              <div className="bg-popover border border-border rounded-lg p-3 shadow-lg text-sm">
                <p className="font-semibold">{label}</p>
                <p className="text-muted-foreground">{payload[0].value} trades</p>
              </div>
            )
          }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={56}>
          {data.map((entry, i) => {
            const isNeg = entry.label.startsWith('<') || entry.label.startsWith('-')
            return <Cell key={i} fill={isNeg ? '#ef4444' : '#10b981'} opacity={0.85} />
          })}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}