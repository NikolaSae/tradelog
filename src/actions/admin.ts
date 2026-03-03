//src/actions/admin.ts

'use server'

import { headers } from 'next/headers'
import { eq, desc, gte, sql, count, and } from 'drizzle-orm'
import { db } from '@/db'
import { users, subscriptions, trades, billingHistory } from '@/db/schema'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

async function requireAdminSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

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
    // Ukupno korisnika
    db.select({ count: sql<number>`count(*)` }).from(users),

    // Novi korisnici ovaj mesec
    db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(gte(users.createdAt, startOfMonth)),

    // Novi korisnici prošli mesec
    db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(
        gte(users.createdAt, startOfLastMonth),
        gte(users.createdAt, endOfLastMonth)
      )),

    // Aktivne pretplate
    db.select({ count: sql<number>`count(*)` })
      .from(subscriptions)
      .where(eq(subscriptions.status, 'ACTIVE')),

    // Pro korisnici
    db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.plan, 'PRO')),

    // Elite korisnici
    db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.plan, 'ELITE')),

    // Ukupno tradova
    db.select({ count: sql<number>`count(*)` }).from(trades),

    // MRR — billing ovaj mesec
    db.select({ total: sql<number>`sum(amount)` })
      .from(billingHistory)
      .where(and(
        gte(billingHistory.createdAt, startOfMonth),
        eq(billingHistory.status, 'paid')
      )),

    // Revenue prošli mesec
    db.select({ total: sql<number>`sum(amount)` })
      .from(billingHistory)
      .where(and(
        gte(billingHistory.createdAt, startOfLastMonth),
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

  // MRR u dolarima (billing je u centima)
  const mrr = Math.round((Number(billingResult[0]?.total ?? 0) / 100) * 100) / 100
  const lastMonthRevenue = Math.round((Number(billingLastMonthResult[0]?.total ?? 0) / 100) * 100) / 100

  // ARR procjena
  const arr = mrr * 12

  // Konverzija %
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

  const conditions = []
  if (plan && plan !== 'all') {
    conditions.push(eq(users.plan, plan as any))
  }

  const offset = (page - 1) * limit

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(conditions.length > 0 ? and(...conditions) : undefined)

  const total = Number(totalResult[0]?.count ?? 0)

  const allUsers = await db.query.users.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: [desc(users.createdAt)],
    limit,
    offset,
  })

  // Filtriraj po search na aplikacijskom nivou (jednostavnije od SQL LIKE)
  const filtered = search
    ? allUsers.filter(u =>
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        (u.name ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : allUsers

  return {
    users: filtered,
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

  // Dohvati email za svakog usera
  const userIds = [...new Set(recent.map(b => b.userId))]
  const usersList = await db.query.users.findMany({
    where: (u, { inArray }) => inArray(u.id, userIds),
  })
  const usersMap = new Map(usersList.map(u => [u.id, u]))

  return recent.map(b => ({
    ...b,
    amount: b.amount / 100, // centima → dolari
    user: usersMap.get(b.userId),
  }))
}

// ── Change User Plan (admin override) ─────────────────────────────────────────

export async function adminSetUserPlan(userId: string, plan: 'FREE' | 'PRO' | 'ELITE') {
  await requireAdminSession()

  await db.update(users)
    .set({ plan, updatedAt: new Date() })
    .where(eq(users.id, userId))

  return { success: true }
}