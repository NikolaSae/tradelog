//src/actions/admin.ts
'use server'

import { headers } from 'next/headers'
import { eq, desc, gte, lte, sql, and, ilike, or } from 'drizzle-orm'
import { db } from '@/db'
import { users, subscriptions, trades, billingHistory } from '@/db/schema'
import { auth } from '@/lib/auth'
import { requireRole } from '@/lib/auth/rbac'
import { auditLogs } from '@/db/schema'
import { nanoid } from 'nanoid'

async function requireAdminSession() {
  return requireRole('admin') // umjesto email check-a
}

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || session.user.email !== adminEmail) {
    throw new Error('Forbidden')
  }

  return session
}

// ── Overview Stats ────────────────────────────────────────────────────────────

export async function getAdminStats() {
  await requireAdminSession()

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  // FIX: bio je gte(endOfLastMonth) umjesto lte — pogrešan range
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

    // FIX: koristimo gte + lte za ispravan range prošlog mjeseca
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

    // FIX: billing prošli mjesec takođe treba ispravan range
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

export async function getAdminUsers({
  page = 1,
  limit = 25,
  plan,
  search,
}: {
  page?: number
  limit?: number
  plan?: string
  search?: string
} = {}) {
  await requireAdminSession()

  const offset = (page - 1) * limit

  // FIX: search radi u SQL, ne u JS nakon paginacije
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
    db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(where),

    db.query.users.findMany({
      where,
      orderBy: [desc(users.createdAt)],
      limit,
      offset,
    }),
  ])

  const total = Number(totalResult[0]?.count ?? 0)

  return {
    users: usersList,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

// ── Recent Billing ────────────────────────────────────────────────────────────

export async function getAdminBilling(limit = 20) {
  await requireAdminSession()

  const recent = await db.query.billingHistory.findMany({
    orderBy: [desc(billingHistory.createdAt)],
    limit,
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

export async function adminSetUserPlan(userId: string, plan: 'FREE' | 'PRO' | 'ELITE') {
  const session = await requireAdminSession()

  await db.update(users)
    .set({ plan, updatedAt: new Date() })
    .where(eq(users.id, userId))

  // Audit log
  await db.insert(auditLogs).values({
    id: nanoid(),
    userId: session.user.id,
    action: 'ADMIN_SET_USER_PLAN',
    entity: 'user',
    entityId: userId,
    metadata: { plan, changedBy: session.user.email },
    createdAt: new Date(),
  })

  return { success: true }
}