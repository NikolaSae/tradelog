//src/actions/goals.ts
'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { eq, and, desc, gte, lte } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { goals, trades } from '@/db/schema'
import { auth } from '@/lib/auth'

const goalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  type: z.enum([
    'NET_PNL', 'WIN_RATE', 'MAX_DRAWDOWN',
    'MAX_DAILY_LOSS', 'MAX_TRADES_PER_DAY',
    'MIN_RRR', 'PROFIT_FACTOR', 'TRADES',
  ]),
  targetValue: z.coerce.number().positive('Target must be positive').max(10_000_000),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
})

export type GoalFormValues = z.infer<typeof goalSchema>

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

function getPeriodDates(period: string): { startDate: Date; endDate: Date } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()

  switch (period) {
    case 'DAILY':
      return {
        startDate: new Date(y, m, d, 0, 0, 0, 0),
        endDate: new Date(y, m, d, 23, 59, 59, 999),
      }
    case 'WEEKLY': {
      const dayOfWeek = now.getDay()
      const monday = new Date(y, m, d - (dayOfWeek === 0 ? 6 : dayOfWeek - 1), 0, 0, 0, 0)
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      sunday.setHours(23, 59, 59, 999)
      return { startDate: monday, endDate: sunday }
    }
    case 'MONTHLY':
      return {
        startDate: new Date(y, m, 1, 0, 0, 0, 0),
        endDate: new Date(y, m + 1, 0, 23, 59, 59, 999),
      }
    case 'QUARTERLY': {
      const quarter = Math.floor(m / 3)
      return {
        startDate: new Date(y, quarter * 3, 1, 0, 0, 0, 0),
        endDate: new Date(y, quarter * 3 + 3, 0, 23, 59, 59, 999),
      }
    }
    case 'YEARLY':
      return {
        startDate: new Date(y, 0, 1, 0, 0, 0, 0),
        endDate: new Date(y, 11, 31, 23, 59, 59, 999),
      }
    default:
      return {
        startDate: new Date(y, m, 1),
        endDate: new Date(y, m + 1, 0, 23, 59, 59, 999),
      }
  }
}

// Računaj stvarnu vrijednost za goal iz trades tabele
async function computeGoalCurrentValue(
  userId: string,
  type: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const closedTrades = await db.query.trades.findMany({
    where: and(
      eq(trades.userId, userId),
      eq(trades.status, 'CLOSED'),
      gte(trades.closedAt, startDate),
      lte(trades.closedAt, endDate)
    ),
  })

  if (closedTrades.length === 0) return 0

  switch (type) {
    case 'NET_PNL': {
      return Math.round(
        closedTrades.reduce((sum, t) => sum + Number(t.netPnl ?? 0), 0) * 100
      ) / 100
    }

    case 'WIN_RATE': {
      const winners = closedTrades.filter(t => Number(t.netPnl ?? 0) > 0)
      return Math.round((winners.length / closedTrades.length) * 1000) / 10
    }

    case 'TRADES': {
      return closedTrades.length
    }

    case 'PROFIT_FACTOR': {
      const grossWins = closedTrades
        .filter(t => Number(t.netPnl ?? 0) > 0)
        .reduce((sum, t) => sum + Number(t.netPnl ?? 0), 0)
      const grossLosses = Math.abs(
        closedTrades
          .filter(t => Number(t.netPnl ?? 0) < 0)
          .reduce((sum, t) => sum + Number(t.netPnl ?? 0), 0)
      )
      if (grossLosses === 0) return grossWins > 0 ? 999 : 0
      return Math.round((grossWins / grossLosses) * 100) / 100
    }

    case 'MIN_RRR': {
      const rMultiples = closedTrades
        .filter(t => t.rMultiple !== null)
        .map(t => Number(t.rMultiple))
      if (rMultiples.length === 0) return 0
      return Math.round(
        (rMultiples.reduce((a, b) => a + b, 0) / rMultiples.length) * 100
      ) / 100
    }

    case 'MAX_DRAWDOWN': {
      const pnls = closedTrades.map(t => Number(t.netPnl ?? 0))
      let peak = 0
      let cumPnl = 0
      let maxDD = 0
      for (const pnl of pnls) {
        cumPnl += pnl
        if (cumPnl > peak) peak = cumPnl
        const dd = peak - cumPnl
        if (dd > maxDD) maxDD = dd
      }
      return Math.round(maxDD * 100) / 100
    }

    case 'MAX_DAILY_LOSS': {
      // Najgori dan u periodu — apsolutna vrijednost gubitka
      const dailyMap = new Map<string, number>()
      for (const t of closedTrades) {
        const date = t.closedAt!.toISOString().split('T')[0]
        dailyMap.set(date, (dailyMap.get(date) ?? 0) + Number(t.netPnl ?? 0))
      }
      const dailyPnls = Array.from(dailyMap.values())
      if (dailyPnls.length === 0) return 0
      const worstDay = Math.min(...dailyPnls)
      // Vraćamo apsolutnu vrijednost gubitka — korisnik unosi npr. 100 za max $100 gubitka
      return Math.round(Math.abs(Math.min(worstDay, 0)) * 100) / 100
    }

    case 'MAX_TRADES_PER_DAY': {
      // Maksimalan broj tradova u jednom danu
      const dailyCount = new Map<string, number>()
      for (const t of closedTrades) {
        const date = t.closedAt!.toISOString().split('T')[0]
        dailyCount.set(date, (dailyCount.get(date) ?? 0) + 1)
      }
      if (dailyCount.size === 0) return 0
      return Math.max(...Array.from(dailyCount.values()))
    }

    default:
      return 0
  }
}

export async function getGoals() {
  const session = await getSession()
  const userId = session.user.id

  const allGoals = await db.query.goals.findMany({
    where: eq(goals.userId, userId),
    orderBy: [desc(goals.createdAt)],
  })

  // Računaj currentValue za svaki goal iz stvarnih trades
  const goalsWithProgress = await Promise.all(
    allGoals.map(async goal => {
      const currentValue = await computeGoalCurrentValue(
        userId,
        goal.type,
        goal.startDate,
        goal.endDate
      )

      // Ažuriraj currentValue u bazi
      await db.update(goals)
        .set({
          currentValue: currentValue.toString(),
          updatedAt: new Date(),
        })
        .where(and(
          eq(goals.id, goal.id),
          eq(goals.userId, userId)
        ))

      return {
        ...goal,
        currentValue: currentValue.toString(),
      }
    })
  )

  return goalsWithProgress
}

export async function createGoal(values: GoalFormValues) {
  const session = await getSession()
  const parsed = goalSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid data' }

  const { startDate, endDate } = getPeriodDates(parsed.data.period)

  // Računaj trenutnu vrijednost odmah pri kreiranju
  const currentValue = await computeGoalCurrentValue(
    session.user.id,
    parsed.data.type,
    startDate,
    endDate
  )

  await db.insert(goals).values({
    id: nanoid(),
    userId: session.user.id,
    title: parsed.data.title,
    type: parsed.data.type as any,
    period: parsed.data.period as any,
    targetValue: parsed.data.targetValue.toString(),
    currentValue: currentValue.toString(),
    startDate,
    endDate,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  revalidatePath('/goals')
  return { success: true }
}

export async function deleteGoal(id: string) {
  const session = await getSession()

  if (!id || id.length > 50) return { error: 'Invalid ID' }

  const existing = await db.query.goals.findFirst({
    where: and(eq(goals.id, id), eq(goals.userId, session.user.id))
  })
  if (!existing) return { error: 'Not found' }

  await db.delete(goals).where(
    and(eq(goals.id, id), eq(goals.userId, session.user.id))
  )

  revalidatePath('/goals')
  return { success: true }
}