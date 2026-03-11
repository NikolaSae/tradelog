//src/actions/calendar.ts
'use server'

import { headers } from 'next/headers'
import { eq, and, gte, lte } from 'drizzle-orm'
import { db } from '@/db'
import { trades, calendarEvents } from '@/db/schema'
import { auth } from '@/lib/auth'
import { createCalendarEventSchema, deleteCalendarEventSchema } from '@/lib/validators/calendar-event'

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

export async function getTradesForDate(date: string) {
  const session = await getSession()
  const userId = session.user.id

  const from = new Date(date + 'T00:00:00')
  const to = new Date(date + 'T23:59:59')

  return db.query.trades.findMany({
    where: and(
      eq(trades.userId, userId),
      gte(trades.openedAt, from),
      lte(trades.openedAt, to)
    ),
    orderBy: (trades, { asc }) => [asc(trades.openedAt)],
  })
}

export async function getCalendarEvents(year: number, month: number) {
  const session = await getSession()
  const userId = session.user.id

  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error('Invalid year')
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error('Invalid month')

  const from = `${year}-${String(month).padStart(2, '0')}-01`
  const to = `${year}-${String(month).padStart(2, '0')}-${String(new Date(year, month, 0).getDate()).padStart(2, '0')}`

  return db.query.calendarEvents.findMany({
    where: and(
      eq(calendarEvents.userId, userId),
      gte(calendarEvents.date, from),
      lte(calendarEvents.date, to)
    ),
    orderBy: (calendarEvents, { asc }) => [asc(calendarEvents.date)],
  })
}

export async function createCalendarEvent(input: unknown) {
  const session = await getSession()
  const userId = session.user.id

  const parsed = createCalendarEventSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input: ' + parsed.error.message)

  const { title, description, date, time, type, severity } = parsed.data

  const [event] = await db.insert(calendarEvents).values({
    userId,
    title,
    description: description ?? null,
    date,
    time: time ?? null,
    type,
    severity,
  }).returning()

  return event
}

export async function deleteCalendarEvent(input: unknown) {
  const session = await getSession()
  const userId = session.user.id

  const parsed = deleteCalendarEventSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  const existing = await db.query.calendarEvents.findFirst({
    where: and(
      eq(calendarEvents.id, parsed.data.id),
      eq(calendarEvents.userId, userId)
    ),
  })

  if (!existing) throw new Error('Not found or unauthorized')

  await db.delete(calendarEvents).where(
    and(
      eq(calendarEvents.id, parsed.data.id),
      eq(calendarEvents.userId, userId)
    )
  )

  return { success: true }
}