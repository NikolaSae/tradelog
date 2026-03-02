//src/components/dashboard/kpi-card.tsx

'use client'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface KpiCardProps {
  title: string
  value: string
  subtitle?: string
  icon?: React.ReactNode
  trend?: number
  trendLabel?: string
  highlight?: boolean
  className?: string
  valueClassName?: string
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  highlight = false,
  className,
  valueClassName,
}: KpiCardProps) {
  const TrendIcon = trend === undefined ? null : trend > 0 ? TrendingUp : trend < 0 ? TrendingDown : Minus

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-card border border-border rounded-xl p-6 transition-all duration-200 hover:shadow-md hover:border-border/80',
        highlight && 'border-primary/30 bg-primary/5',
        className
      )}
    >
      {/* Background decoration */}
      {icon && (
        <div className="absolute top-4 right-4 opacity-5 [&>svg]:h-16 [&>svg]:w-16">
          {icon}
        </div>
      )}

      <div className="relative space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {title}
          </p>
          {icon && (
            <div className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center',
              highlight ? 'bg-primary/10' : 'bg-muted'
            )}>
              <span className={cn(
                '[&>svg]:h-4 [&>svg]:w-4',
                highlight ? '[&>svg]:text-primary' : '[&>svg]:text-muted-foreground'
              )}>
                {icon}
              </span>
            </div>
          )}
        </div>

        {/* Value */}
        <p className={cn(
          'text-2xl font-bold tracking-tight leading-none',
          valueClassName
        )}>
          {value}
        </p>

        {/* Trend / Subtitle */}
        {(trend !== undefined || subtitle || trendLabel) && (
          <div className="flex items-center gap-2">
            {TrendIcon && (
              <div className={cn(
                'flex items-center gap-1 text-xs font-medium',
                trend! > 0 ? 'text-emerald-500' : trend! < 0 ? 'text-red-500' : 'text-muted-foreground'
              )}>
                <TrendIcon className="h-3 w-3" />
                <span>
                  {trend! > 0 ? '+' : ''}{trend}%
                </span>
              </div>
            )}
            {(subtitle || trendLabel) && (
              <p className="text-xs text-muted-foreground">
                {trendLabel ?? subtitle}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}