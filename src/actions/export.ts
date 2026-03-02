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

  // Vrati plain objekte pogodne za CSV/Excel
  return allTrades.map(t => ({
    Symbol: t.symbol,
    Direction: t.direction,
    Status: t.status,
    'Entry Price': t.entryPrice,
    'Exit Price': t.exitPrice ?? '',
    'Stop Loss': t.stopLoss ?? '',
    'Take Profit': t.takeProfit ?? '',
    'Lot Size': t.lotSize,
    Commission: t.commission ?? 0,
    Swap: t.swap ?? 0,
    'Gross PnL': t.grossPnl ?? '',
    'Net PnL': t.netPnl ?? '',
    'R Multiple': t.rMultiple ?? '',
    'Opened At': t.openedAt.toISOString(),
    'Closed At': t.closedAt?.toISOString() ?? '',
    'Duration (min)': t.durationMinutes ?? '',
    Session: t.session ?? '',
    Emotion: t.emotionTag ?? '',
    Notes: t.notes ?? '',
  }))
}