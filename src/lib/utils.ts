//src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// ← Dodati ove konstante
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

const VALID_PERIODS = ['day', 'week', 'month', 'quarter', 'year', 'all'] as const
type TimePeriod = typeof VALID_PERIODS[number]

export { DATE_REGEX, VALID_PERIODS }
export type { TimePeriod }

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

export function toLocalDateStr(date: Date): string {
  // Koristimo UTC metode jer snimamo u UTC
  const y = date.getUTCFullYear()
  const m = String(date.getUTCMonth() + 1).padStart(2, '0')
  const d = String(date.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function parseDateRange(date: string): { from: Date; to: Date } {
  if (!DATE_REGEX.test(date)) throw new Error('Invalid date format')
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) throw new Error('Invalid date')
  if (month < 1 || month > 12) throw new Error('Invalid date')
  if (day < 1 || day > 31) throw new Error('Invalid date')
  const from = new Date(year, month - 1, day, 0, 0, 0, 0)
  const to = new Date(year, month - 1, day, 23, 59, 59, 999)
  if (isNaN(from.getTime()) || isNaN(to.getTime())) throw new Error('Invalid date')
  return { from, to }
}

export function getDayRange(dateStr: string): { from: Date; to: Date } {
  if (!DATE_REGEX.test(dateStr)) throw new Error('Invalid date format')
  const [year, month, day] = dateStr.split('-').map(Number)
  if (!year || !month || !day) throw new Error('Invalid date')
  // UTC granice — od UTC ponoći do UTC ponoći
  const from = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
  const to = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0))
  if (isNaN(from.getTime())) throw new Error('Invalid date')
  return { from, to }
}

export function dateStringToTimestamp(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  // UTC podne — ne lokalno, eliminira sve timezone probleme
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))
}

export function getFromDate(period: TimePeriod): Date | null {
  const now = new Date()
  const from = new Date()
  if (period === 'all') return null
  if (period === 'day') from.setHours(0, 0, 0, 0)
  else if (period === 'week') from.setDate(now.getDate() - 7)
  else if (period === 'month') from.setMonth(now.getMonth() - 1)
  else if (period === 'quarter') from.setMonth(now.getMonth() - 3)
  else if (period === 'year') from.setFullYear(now.getFullYear() - 1)
  return from
}

export function validatePeriod(period: unknown): TimePeriod {
  if (!VALID_PERIODS.includes(period as TimePeriod)) throw new Error('Invalid period')
  return period as TimePeriod
}