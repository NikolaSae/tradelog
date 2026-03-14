//src/actions/calendar.ts
'use server'

import { headers } from 'next/headers'
import { eq, and, gte, lte } from 'drizzle-orm'
import { db } from '@/db'
import { trades, calendarEvents } from '@/db/schema'
import { auth } from '@/lib/auth'
import { createCalendarEventSchema, deleteCalendarEventSchema } from '@/lib/validators/calendar-event'
import { parseDateRange } from '@/lib/utils'

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

function toLocalDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}



export async function getCalendarData(year: number, month: number) {
  const session = await getSession()
  const userId = session.user.id

  if (!Number.isInteger(year) || year < 2000 || year > 2100) throw new Error('Invalid year')
  if (!Number.isInteger(month) || month < 1 || month > 12) throw new Error('Invalid month')

  const from = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const to = new Date(year, month, 0, 23, 59, 59, 999)

  const allTrades = await db.query.trades.findMany({
    where: and(
      eq(trades.userId, userId),
      eq(trades.status, 'CLOSED'),
      gte(trades.closedAt, from),
      lte(trades.closedAt, to)
    ),
  })

  const map = new Map<string, { pnl: number; count: number; wins: number }>()
  for (const t of allTrades) {
    const date = toLocalDateStr(new Date(t.closedAt!))
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

  const { from, to } = parseDateRange(date)

  return db.query.trades.findMany({
    where: and(
      eq(trades.userId, userId),
      gte(trades.closedAt, from),
      lte(trades.closedAt, to)
    ),
    orderBy: (trades, { asc }) => [asc(trades.closedAt)],
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
  // Ne exposuj Zod detalje — generička poruka korisniku
  if (!parsed.success) throw new Error('Invalid input')

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

  // Ista poruka za "not found" i "unauthorized" — ne otkrivaj da li zapis postoji
  if (!existing) throw new Error('Not found')

  await db.delete(calendarEvents).where(
    and(
      eq(calendarEvents.id, parsed.data.id),
      eq(calendarEvents.userId, userId)
    )
  )

  return { success: true }
}