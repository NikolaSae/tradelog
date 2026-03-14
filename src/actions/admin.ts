//src/actions/admin.ts
'use server'

import { headers } from 'next/headers'
import { eq, desc, gte, lte, sql, and, ilike, or } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db } from '@/db'
import { users, subscriptions, trades, billingHistory, auditLogs } from '@/db/schema'
import { requireRole } from '@/lib/auth/rbac'

// FIX: requireRole umjesto email check-a, nema ostataka starog koda
async function requireAdminSession() {
  return requireRole('admin')
}

// ── Overview Stats ────────────────────────────────────────────────────────────

export async function getAdminStats() {
  await requireAdminSession()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)

  const [
    totalUsersResult,
    newUsersThisMonthResult,
    newUsersLastMonthResult,
    activeSubsResult,
    proSubsResult,
    eliteSubsResult,
    totalTradesResult,
    billingResult,
    billingLastMonthResult,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users),

    db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.createdAt, startOfMonth)),

    db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(
        gte(users.createdAt, startOfLastMonth),
        lte(users.createdAt, endOfLastMonth)
      )),

    db.select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'ACTIVE')),

    db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.plan, 'PRO')),

    db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.plan, 'ELITE')),

    db.select({ count: sql<number>`count(*)` }).from(trades),

    db.select({ total: sql<number>`sum(amount)` })
      .from(billingHistory)
      .where(and(
        gte(billingHistory.createdAt, startOfMonth),
        eq(billingHistory.status, 'paid')
      )),

    db.select({ total: sql<number>`sum(amount)` })
      .from(billingHistory)
      .where(and(
        gte(billingHistory.createdAt, startOfLastMonth),
        lte(billingHistory.createdAt, endOfLastMonth),
        eq(billingHistory.status, 'paid')
      )),
  ])

  const totalUsers = Number(totalUsersResult[0]?.count ?? 0)
  const newUsersThisMonth = Number(newUsersThisMonthResult[0]?.count ?? 0)
  const activeSubs = Number(activeSubsResult[0]?.count ?? 0)
  const proUsers = Number(proSubsResult[0]?.count ?? 0)
  const eliteUsers = Number(eliteSubsResult[0]?.count ?? 0)
  const freeUsers = totalUsers - proUsers - eliteUsers
  const totalTradesCount = Number(totalTradesResult[0]?.count ?? 0)

  const mrr = Math.round((Number(billingResult[0]?.total ?? 0) / 100) * 100) / 100
  const lastMonthRevenue = Math.round((Number(billingLastMonthResult[0]?.total ?? 0) / 100) * 100) / 100
  const arr = mrr * 12

  const conversionRate = totalUsers > 0
    ? Math.round(((proUsers + eliteUsers) / totalUsers) * 1000) / 10
    : 0

  return {
    totalUsers,
    newUsersThisMonth,
    activeSubs,
    proUsers,
    eliteUsers,
    freeUsers,
    totalTrades: totalTradesCount,
    mrr,
    arr,
    lastMonthRevenue,
    conversionRate,
  }
}

// ── Users List ────────────────────────────────────────────────────────────────

export async function getAdminUsers(input: {
  page?: number
  limit?: number
  plan?: string
  search?: string
} = {}) {
  await requireAdminSession()

  // Validacija svih parametara
  const parsed = getUsersSchema.safeParse(input)
  if (!parsed.success) throw new Error('Invalid input')

  const { page, limit, plan, search } = parsed.data
  const offset = (page - 1) * limit
  const conditions = []

  if (plan && plan !== 'all') {
    conditions.push(eq(users.plan, plan as any))
  }

  if (search && search.trim() !== '') {
    conditions.push(
      or(
        ilike(users.email, `%${search.trim()}%`),
        ilike(users.name, `%${search.trim()}%`)
      )
    )
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined

  const [totalResult, usersList] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(users).where(where),
    db.query.users.findMany({
      where,
      orderBy: [desc(users.createdAt)],
      limit,
      offset,
    }),
  ])

  return {
    users: usersList,
    total: Number(totalResult[0]?.count ?? 0),
    page,
    totalPages: Math.ceil(Number(totalResult[0]?.count ?? 0) / limit),
  }
}

// ── Recent Billing ────────────────────────────────────────────────────────────

export async function getAdminBilling(limit = 20) {
  await requireAdminSession()

  // Ograniči limit
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100)

  const recent = await db.query.billingHistory.findMany({
    orderBy: [desc(billingHistory.createdAt)],
    limit: safeLimit,
  })

  const userIds = [...new Set(recent.map(b => b.userId))]
  const usersList = await db.query.users.findMany({
    where: (u, { inArray }) => inArray(u.id, userIds),
  })
  const usersMap = new Map(usersList.map(u => [u.id, u]))

  return recent.map(b => ({
    ...b,
    amount: b.amount / 100,
    user: usersMap.get(b.userId),
  }))
}

// ── Change User Plan ──────────────────────────────────────────────────────────

const setUserPlanSchema = z.object({
  userId: z.string().min(1).max(128),
  plan: z.enum(['FREE', 'PRO', 'ELITE']),
})

const getUsersSchema = z.object({
  page: z.number().int().positive().max(10_000).default(1),
  limit: z.number().int().positive().max(100).default(25), // max 100 po stranici
  plan: z.enum(['FREE', 'PRO', 'ELITE', 'all']).optional(),
  search: z.string().max(100).optional(), // max dužina search stringa
})

export async function adminSetUserPlan(userId: string, plan: 'FREE' | 'PRO' | 'ELITE') {
  const session = await requireAdminSession()

  // Runtime validacija — TypeScript tipovi ne postoje u runtime
  const parsed = setUserPlanSchema.safeParse({ userId, plan })
  if (!parsed.success) throw new Error('Invalid input')

  await db.update(users)
    .set({ plan: parsed.data.plan, updatedAt: new Date() })
    .where(eq(users.id, parsed.data.userId))

  await db.insert(auditLogs).values({
    id: nanoid(),
    userId: session.user.id,
    action: 'ADMIN_SET_USER_PLAN',
    entity: 'user',
    entityId: parsed.data.userId,
    metadata: { plan: parsed.data.plan, changedBy: session.user.email },
    createdAt: new Date(),
  })

  return { success: true }
}