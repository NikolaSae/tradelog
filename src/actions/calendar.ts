//src/actions/calendar.ts
'use server'

import { headers } from 'next/headers'
import { eq, and, gte, lte } from 'drizzle-orm'
import { db } from '@/db'
import { trades } from '@/db/schema'
import { auth } from '@/lib/auth'

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function getCalendarData(year: number, month: number) {
  const session = await getSession()
  const userId = session.user.id

  const from = new Date(year, month - 1, 1)
  const to = new Date(year, month, 0, 23, 59, 59)

  const allTrades = await db.query.trades.findMany({
    where: and(
      eq(trades.userId, userId),
      eq(trades.status, 'CLOSED'),
      gte(trades.openedAt, from),
      lte(trades.openedAt, to)
    ),
  })

  const map = new Map<string, { pnl: number; count: number; wins: number }>()
  for (const t of allTrades) {
    const date = new Date(t.openedAt).toISOString().split('T')[0]
    const existing = map.get(date) ?? { pnl: 0, count: 0, wins: 0 }
    const pnl = Number(t.netPnl ?? 0)
    map.set(date, {
      pnl: existing.pnl + pnl,
      count: existing.count + 1,
      wins: existing.wins + (pnl > 0 ? 1 : 0),
    })
  }

  return Array.from(map.entries()).map(([date, data]) => ({
    date,
    pnl: Math.round(data.pnl * 100) / 100,
    count: data.count,
    winRate: Math.round((data.wins / data.count) * 1000) / 10,
  }))
}

// ← NOVO: vraća sve tradove za konkretan datum
export async function getTradesForDate(date: string) {
  const session = await getSession()
  const userId = session.user.id

  const from = new Date(date + 'T00:00:00')
  const to = new Date(date + 'T23:59:59')

  const result = await db.query.trades.findMany({
    where: and(
      eq(trades.userId, userId),
      gte(trades.openedAt, from),
      lte(trades.openedAt, to)
    ),
    orderBy: (trades, { asc }) => [asc(trades.openedAt)],
  })

  return result
}