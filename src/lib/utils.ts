//src/lib/utils.ts

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency = 'USD',
  options?: Intl.NumberFormatOptions
) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount)
}

export function formatPercent(value: number, decimals = 1) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`
}

export function formatPnl(value: number, currency = 'USD') {
  const formatted = formatCurrency(Math.abs(value), currency)
  return value >= 0 ? `+${formatted}` : `-${formatted}`
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

export function getPnlColor(value: number): string {
  if (value > 0) return 'text-emerald-500'
  if (value < 0) return 'text-red-500'
  return 'text-muted-foreground'
}

export function getPnlBg(value: number): string {
  if (value > 0) return 'bg-emerald-500/10 text-emerald-500'
  if (value < 0) return 'bg-red-500/10 text-red-500'
  return 'bg-muted text-muted-foreground'
}