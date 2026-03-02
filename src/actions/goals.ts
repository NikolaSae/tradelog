//src/actions/goals.ts
'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { eq, and, desc } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { goals } from '@/db/schema'
import { auth } from '@/lib/auth'

const goalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  type: z.enum([
    'NET_PNL', 'WIN_RATE', 'MAX_DRAWDOWN',
    'MAX_DAILY_LOSS', 'MAX_TRADES_PER_DAY',
    'MIN_RRR', 'PROFIT_FACTOR', 'TRADES',
  ]),
  targetValue: z.coerce.number(),
  period: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY']),
})

export type GoalFormValues = z.infer<typeof goalSchema>

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

// Računaj startDate/endDate na osnovu perioda
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

export async function getGoals() {
  const session = await getSession()
  return db.query.goals.findMany({
    where: eq(goals.userId, session.user.id),
    orderBy: [desc(goals.createdAt)],
  })
}

export async function createGoal(values: GoalFormValues) {
  const session = await getSession()
  const parsed = goalSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid data' }

  const { startDate, endDate } = getPeriodDates(parsed.data.period)

  await db.insert(goals).values({
    id: nanoid(),
    userId: session.user.id,
    title: parsed.data.title,
    type: parsed.data.type as any,
    period: parsed.data.period as any,
    targetValue: parsed.data.targetValue.toString(),
    currentValue: '0',
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
  await db.delete(goals).where(
    and(eq(goals.id, id), eq(goals.userId, session.user.id))
  )
  revalidatePath('/goals')
  return { success: true }
}