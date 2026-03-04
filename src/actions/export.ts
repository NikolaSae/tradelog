//src/actions/export.ts
'use server'

import { headers } from 'next/headers'
import { eq, and, gte, desc } from 'drizzle-orm'
import { db } from '@/db'
import { trades } from '@/db/schema'
import { auth } from '@/lib/auth'
import type { TimePeriod } from '@/types/trade'

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

function getPeriodStart(period: TimePeriod): Date | null {
  const now = new Date()
  const from = new Date()
  if (period === 'all') return null
  if (period === 'week') from.setDate(now.getDate() - 7)
  else if (period === 'month') from.setMonth(now.getMonth() - 1)
  else if (period === 'quarter') from.setMonth(now.getMonth() - 3)
  else if (period === 'year') from.setFullYear(now.getFullYear() - 1)
  return from
}

/**
 * FIX: CSV/Excel Formula Injection zaštita
 * Ako string počinje sa =, +, -, @ — prefiksiraj apostrofom.
 * Ovo sprječava izvršavanje formula u Excel/LibreOffice.
 */
function sanitizeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.length === 0) return ''
  // Formula injection prefiksi
  if ([' =', '+', '-', '@', '\t', '\r'].some(prefix => str.startsWith(prefix))) {
    return `'${str}`
  }
  // Ukloni newline karaktere koji mogu pokvariti CSV strukturu
  return str.replace(/[\r\n]/g, ' ')
}

export async function getTradesForExport(period: TimePeriod = 'month') {
  const session = await getSession()
  const userId = session.user.id

  const conditions = [eq(trades.userId, userId)]
  const from = getPeriodStart(period)
  if (from) conditions.push(gte(trades.openedAt, from))

  const allTrades = await db.query.trades.findMany({
    where: and(...conditions),
    orderBy: [desc(trades.openedAt)],
  })

  return allTrades.map(t => ({
    Symbol:          sanitizeCell(t.symbol),
    Direction:       sanitizeCell(t.direction),
    Status:          sanitizeCell(t.status),
    'Entry Price':   sanitizeCell(t.entryPrice),
    'Exit Price':    sanitizeCell(t.exitPrice),
    'Stop Loss':     sanitizeCell(t.stopLoss),
    'Take Profit':   sanitizeCell(t.takeProfit),
    'Lot Size':      sanitizeCell(t.lotSize),
    Commission:      sanitizeCell(t.commission ?? 0),
    Swap:            sanitizeCell(t.swap ?? 0),
    'Gross PnL':     sanitizeCell(t.grossPnl),
    'Net PnL':       sanitizeCell(t.netPnl),
    'R Multiple':    sanitizeCell(t.rMultiple),
    'Opened At':     sanitizeCell(t.openedAt.toISOString()),
    'Closed At':     sanitizeCell(t.closedAt?.toISOString()),
    'Duration (min)': sanitizeCell(t.durationMinutes),
    Session:         sanitizeCell(t.session),
    Emotion:         sanitizeCell(t.emotionTag),
    // Notes je najriskantnije polje — sanitizacija je kritična ovdje
    Notes:           sanitizeCell(t.notes),
  }))
}