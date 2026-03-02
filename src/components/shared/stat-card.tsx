//src/components/shared/stat-card.tsx


import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  trend?: number
  className?: string
  valueClassName?: string
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  className,
  valueClassName,
}: StatCardProps) {
  return (
    <div className={cn(
      'bg-card border border-border rounded-xl p-6 space-y-2',
      className
    )}>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">{title}</p>
        {Icon && (
          <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </div>

      <p className={cn('text-2xl font-bold tracking-tight', valueClassName)}>
        {value}
      </p>

      {(subtitle || trend !== undefined) && (
        <div className="flex items-center gap-2">
          {trend !== undefined && (
            <span className={cn(
              'text-xs font-medium',
              trend > 0 ? 'text-emerald-500' : trend < 0 ? 'text-red-500' : 'text-muted-foreground'
            )}>
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  )
}