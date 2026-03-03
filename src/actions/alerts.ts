//src/actions/alerts.ts

'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { eq, and, desc } from 'drizzle-orm'
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
  threshold: z.coerce.number().positive(),
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

  await db.update(alerts)
    .set({ isActive: !alert.isActive })
    .where(eq(alerts.id, id))

  revalidatePath('/alerts')
  return { success: true }
}

export async function deleteAlert(id: string) {
  const session = await getSession()
  await db.delete(alerts).where(
    and(eq(alerts.id, id), eq(alerts.userId, session.user.id))
  )
  revalidatePath('/alerts')
  return { success: true }
}

// ── Alert Check Engine ────────────────────────────────────────────────────────
// Poziva se svaki put kad korisnik doda novi trade

export async function checkAlertsForUser(userId: string) {
  const userAlerts = await db.query.alerts.findMany({
    where: and(
      eq(alerts.userId, userId),
      eq(alerts.isActive, true)
    ),
  })

  if (userAlerts.length === 0) return []

  // Dohvati tradove za danas
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayTrades = await db.query.trades.findMany({
    where: and(
      eq(trades.userId, userId),
      eq(trades.status, 'CLOSED'),
    ),
  })

  const todayOnly = todayTrades.filter(
    t => (t.closedAt ?? t.openedAt) >= todayStart
  )

  const triggered: { type: string; message: string }[] = []

  for (const alert of userAlerts) {
    const threshold = Number(alert.threshold)

    switch (alert.type) {

      case 'DAILY_LOSS_LIMIT': {
        const dailyPnl = todayOnly.reduce((s, t) => s + Number(t.netPnl ?? 0), 0)
        if (dailyPnl <= -threshold) {
          triggered.push({
            type: 'DAILY_LOSS_LIMIT',
            message: `Daily loss limit hit: $${Math.abs(dailyPnl).toFixed(2)} lost today (limit: $${threshold})`,
          })
          // Ažuriraj lastFired
          await db.update(alerts)
            .set({ lastFired: new Date() })
            .where(eq(alerts.id, alert.id))
        }
        break
      }

      case 'LOSING_STREAK': {
        // Provjeri posljednjih N tradova
        const recent = todayTrades
          .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime())
          .slice(0, Math.ceil(threshold) + 2)

        let streak = 0
        for (const t of recent) {
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
            .where(eq(alerts.id, alert.id))
        }
        break
      }

      case 'OVERTRADING': {
        if (todayOnly.length >= threshold) {
          triggered.push({
            type: 'OVERTRADING',
            message: `Overtrading alert: ${todayOnly.length} trades today (limit: ${threshold})`,
          })
          await db.update(alerts)
            .set({ lastFired: new Date() })
            .where(eq(alerts.id, alert.id))
        }
        break
      }

      case 'DRAWDOWN_LIMIT': {
        // Maksimalni drawdown od sve vremena
        const allClosed = todayTrades.sort(
          (a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime()
        )
        let peak = 0
        let cumPnl = 0
        let maxDD = 0
        for (const t of allClosed) {
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
            .where(eq(alerts.id, alert.id))
        }
        break
      }
    }
  }

  return triggered
}