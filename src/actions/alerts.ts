//src/actions/alerts.ts
'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { eq, and, desc, gte } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { alerts, trades } from '@/db/schema'
import { auth } from '@/lib/auth'

const alertSchema = z.object({
  type: z.enum([
    'DAILY_LOSS_LIMIT',
    'DRAWDOWN_LIMIT',
    'LOSING_STREAK',
    'OVERTRADING',
    'GOAL_ACHIEVED',
  ]),
  // Gornja granica spriječava ekstremne vrijednosti
  threshold: z.coerce.number().positive().max(1_000_000),
})

export type AlertFormValues = z.infer<typeof alertSchema>

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function getAlerts() {
  const session = await getSession()
  return db.query.alerts.findMany({
    where: eq(alerts.userId, session.user.id),
    orderBy: [desc(alerts.createdAt)],
  })
}

export async function createAlert(values: AlertFormValues) {
  const session = await getSession()
  const parsed = alertSchema.safeParse(values)
  if (!parsed.success) return { error: 'Invalid data' }

  await db.insert(alerts).values({
    id: nanoid(),
    userId: session.user.id,
    type: parsed.data.type as any,
    threshold: parsed.data.threshold.toString(),
    isActive: true,
    createdAt: new Date(),
  })

  revalidatePath('/alerts')
  return { success: true }
}

export async function toggleAlert(id: string) {
  const session = await getSession()

  const alert = await db.query.alerts.findFirst({
    where: and(eq(alerts.id, id), eq(alerts.userId, session.user.id)),
  })
  if (!alert) return { error: 'Not found' }

  // FIX: userId u WHERE — ne oslanjamo se samo na prethodnu provjeru
  await db.update(alerts)
    .set({ isActive: !alert.isActive })
    .where(and(eq(alerts.id, id), eq(alerts.userId, session.user.id)))

  revalidatePath('/alerts')
  return { success: true }
}

export async function deleteAlert(id: string) {
  const session = await getSession()

  // FIX: provjeri ownership prije brisanja
  const existing = await db.query.alerts.findFirst({
    where: and(eq(alerts.id, id), eq(alerts.userId, session.user.id)),
  })
  if (!existing) return { error: 'Not found' }

  await db.delete(alerts).where(
    and(eq(alerts.id, id), eq(alerts.userId, session.user.id))
  )

  revalidatePath('/alerts')
  return { success: true }
}

// FIX: checkAlertsForUser — interno, poziva se samo sa session.user.id
// Ne prima userId kao vanjski argument — caller ne može proslijediti tuđi userId
export async function checkAlertsForCurrentUser() {
  const session = await getSession()
  const userId = session.user.id
  return _runAlertCheck(userId)
}

// Interna funkcija — nije exportovana, ne može biti pozvana direktno
async function _runAlertCheck(userId: string) {
  const userAlerts = await db.query.alerts.findMany({
    where: and(
      eq(alerts.userId, userId),
      eq(alerts.isActive, true)
    ),
  })

  if (userAlerts.length === 0) return []

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayTrades = await db.query.trades.findMany({
    where: and(
      eq(trades.userId, userId),
      eq(trades.status, 'CLOSED'),
      gte(trades.openedAt, todayStart)
    ),
  })

  const recentTrades = await db.query.trades.findMany({
    where: and(
      eq(trades.userId, userId),
      eq(trades.status, 'CLOSED'),
    ),
    orderBy: [desc(trades.openedAt)],
    limit: 200,
  })

  const triggered: { type: string; message: string }[] = []

  for (const alert of userAlerts) {
    const threshold = Number(alert.threshold)

    switch (alert.type) {
      case 'DAILY_LOSS_LIMIT': {
        const dailyPnl = todayTrades.reduce((s, t) => s + Number(t.netPnl ?? 0), 0)
        if (dailyPnl <= -threshold) {
          triggered.push({
            type: 'DAILY_LOSS_LIMIT',
            message: `Daily loss limit hit: $${Math.abs(dailyPnl).toFixed(2)} lost today (limit: $${threshold})`,
          })
          await db.update(alerts)
            .set({ lastFired: new Date() })
            .where(and(eq(alerts.id, alert.id), eq(alerts.userId, userId)))
        }
        break
      }

      case 'OVERTRADING': {
        if (todayTrades.length >= threshold) {
          triggered.push({
            type: 'OVERTRADING',
            message: `Overtrading alert: ${todayTrades.length} trades today (limit: ${threshold})`,
          })
          await db.update(alerts)
            .set({ lastFired: new Date() })
            .where(and(eq(alerts.id, alert.id), eq(alerts.userId, userId)))
        }
        break
      }

      case 'LOSING_STREAK': {
        let streak = 0
        for (const t of recentTrades) {
          if (Number(t.netPnl ?? 0) < 0) streak++
          else break
        }
        if (streak >= threshold) {
          triggered.push({
            type: 'LOSING_STREAK',
            message: `Losing streak alert: ${streak} consecutive losing trades`,
          })
          await db.update(alerts)
            .set({ lastFired: new Date() })
            .where(and(eq(alerts.id, alert.id), eq(alerts.userId, userId)))
        }
        break
      }

      case 'DRAWDOWN_LIMIT': {
        const sorted = [...recentTrades].reverse()
        let peak = 0
        let cumPnl = 0
        let maxDD = 0
        for (const t of sorted) {
          cumPnl += Number(t.netPnl ?? 0)
          if (cumPnl > peak) peak = cumPnl
          const dd = peak - cumPnl
          if (dd > maxDD) maxDD = dd
        }
        if (maxDD >= threshold) {
          triggered.push({
            type: 'DRAWDOWN_LIMIT',
            message: `Drawdown alert: $${maxDD.toFixed(2)} drawdown (limit: $${threshold})`,
          })
          await db.update(alerts)
            .set({ lastFired: new Date() })
            .where(and(eq(alerts.id, alert.id), eq(alerts.userId, userId)))
        }
        break
      }
    }
  }

  return triggered
}