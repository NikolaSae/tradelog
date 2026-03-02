// src/actions/analytics.ts
'use server'

import { headers } from 'next/headers'
import { eq, and, gte, desc } from 'drizzle-orm'
import { db } from '@/db'
import { trades } from '@/db/schema'
import { auth } from '@/lib/auth'
import type { TimePeriod } from '@/types/trade'

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

function getFromDate(period: TimePeriod): Date | null {
  const now = new Date()
  const from = new Date()
  if (period === 'all') return null
  if (period === 'day') from.setHours(0, 0, 0, 0)
  else if (period === 'week') from.setDate(now.getDate() - 7)
  else if (period === 'month') from.setMonth(now.getMonth() - 1)
  else if (period === 'quarter') from.setMonth(now.getMonth() - 3)
  else if (period === 'year') from.setFullYear(now.getFullYear() - 1)
  return from
}

// ── Performance Analytics ────────────────────────────────────────────────────

export async function getPerformanceAnalytics(period: TimePeriod = 'month') {
  const session = await getSession()
  const userId = session.user.id
  const from = getFromDate(period)

  const conditions = [eq(trades.userId, userId), eq(trades.status, 'CLOSED')]
  if (from) conditions.push(gte(trades.openedAt, from))

  const allTrades = await db.query.trades.findMany({
    where: and(...conditions),
    orderBy: [desc(trades.openedAt)],
  })

  if (allTrades.length === 0) return null

  // P&L by symbol
  const bySymbol = new Map<string, { symbol: string; pnl: number; trades: number; wins: number }>()
  for (const t of allTrades) {
    const pnl = Number(t.netPnl ?? 0)
    const existing = bySymbol.get(t.symbol) ?? { symbol: t.symbol, pnl: 0, trades: 0, wins: 0 }
    bySymbol.set(t.symbol, {
      symbol: t.symbol,
      pnl: existing.pnl + pnl,
      trades: existing.trades + 1,
      wins: existing.wins + (pnl > 0 ? 1 : 0),
    })
  }
  const pnlBySymbol = Array.from(bySymbol.values())
    .sort((a, b) => b.pnl - a.pnl)
    .map((s) => ({ ...s, pnl: Math.round(s.pnl * 100) / 100, winRate: Math.round((s.wins / s.trades) * 100) }))

  // P&L by day of week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const byDay = Array.from({ length: 7 }, (_, i) => ({
    day: dayNames[i],
    pnl: 0,
    trades: 0,
    wins: 0,
  }))
  for (const t of allTrades) {
    const day = new Date(t.openedAt).getDay()
    const pnl = Number(t.netPnl ?? 0)
    byDay[day].pnl += pnl
    byDay[day].trades += 1
    byDay[day].wins += pnl > 0 ? 1 : 0
  }
  const pnlByDay = byDay
    .filter((d) => d.trades > 0)
    .map((d) => ({
      ...d,
      pnl: Math.round(d.pnl * 100) / 100,
      winRate: Math.round((d.wins / d.trades) * 100),
    }))

  // P&L by session
  const bySession = new Map<string, { session: string; pnl: number; trades: number; wins: number }>()
  for (const t of allTrades) {
    const key = t.session ?? 'UNKNOWN'
    const pnl = Number(t.netPnl ?? 0)
    const existing = bySession.get(key) ?? { session: key, pnl: 0, trades: 0, wins: 0 }
    bySession.set(key, {
      session: key,
      pnl: existing.pnl + pnl,
      trades: existing.trades + 1,
      wins: existing.wins + (pnl > 0 ? 1 : 0),
    })
  }
  const pnlBySession = Array.from(bySession.values())
    .sort((a, b) => b.pnl - a.pnl)
    .map((s) => ({ ...s, pnl: Math.round(s.pnl * 100) / 100, winRate: Math.round((s.wins / s.trades) * 100) }))

  // Cumulative P&L over time
  const sorted = [...allTrades].sort(
    (a, b) => new Date(a.openedAt).getTime() - new Date(b.openedAt).getTime()
  )
  let cumPnl = 0
  const cumulativePnl = sorted.map((t) => {
    cumPnl += Number(t.netPnl ?? 0)
    return {
      date: t.openedAt.toISOString().split('T')[0],
      pnl: Math.round(cumPnl * 100) / 100,
      tradePnl: Math.round(Number(t.netPnl ?? 0) * 100) / 100,
    }
  })

  // Long vs Short
  const longs = allTrades.filter((t) => t.direction === 'LONG')
  const shorts = allTrades.filter((t) => t.direction === 'SHORT')
  const directionStats = {
    long: {
      trades: longs.length,
      pnl: Math.round(longs.reduce((s, t) => s + Number(t.netPnl ?? 0), 0) * 100) / 100,
      winRate: longs.length > 0
        ? Math.round((longs.filter((t) => Number(t.netPnl ?? 0) > 0).length / longs.length) * 100)
        : 0,
    },
    short: {
      trades: shorts.length,
      pnl: Math.round(shorts.reduce((s, t) => s + Number(t.netPnl ?? 0), 0) * 100) / 100,
      winRate: shorts.length > 0
        ? Math.round((shorts.filter((t) => Number(t.netPnl ?? 0) > 0).length / shorts.length) * 100)
        : 0,
    },
  }

  return { pnlBySymbol, pnlByDay, pnlBySession, cumulativePnl, directionStats }
}

// ── Risk Analytics ────────────────────────────────────────────────────────────

export async function getRiskAnalytics(period: TimePeriod = 'month') {
  const session = await getSession()
  const userId = session.user.id
  const from = getFromDate(period)

  const conditions = [eq(trades.userId, userId), eq(trades.status, 'CLOSED')]
  if (from) conditions.push(gte(trades.openedAt, from))

  const allTrades = await db.query.trades.findMany({ where: and(...conditions) })
  if (allTrades.length === 0) return null

  const pnls = allTrades.map((t) => Number(t.netPnl ?? 0))

  // Max drawdown
  let peak = 0
  let cumPnl = 0
  let maxDrawdown = 0
  for (const pnl of pnls) {
    cumPnl += pnl
    if (cumPnl > peak) peak = cumPnl
    const drawdown = peak - cumPnl
    if (drawdown > maxDrawdown) maxDrawdown = drawdown
  }

  // Win/Loss streaks
  let currentStreak = 0
  let maxWinStreak = 0
  let maxLossStreak = 0
  let tempStreak = 0
  let lastWin: boolean | null = null

  for (const pnl of pnls) {
    const isWin = pnl > 0
    if (lastWin === null || isWin !== lastWin) {
      tempStreak = 1
    } else {
      tempStreak++
    }
    if (isWin) {
      if (tempStreak > maxWinStreak) maxWinStreak = tempStreak
    } else {
      if (tempStreak > maxLossStreak) maxLossStreak = tempStreak
    }
    lastWin = isWin
    currentStreak = pnls[pnls.length - 1] > 0 ? tempStreak : -tempStreak
  }

  // R distribution
  const rMultiples = allTrades
    .filter((t) => t.rMultiple !== null)
    .map((t) => Number(t.rMultiple))

  const rBuckets = [
    { label: '< -2R', min: -Infinity, max: -2 },
    { label: '-2R to -1R', min: -2, max: -1 },
    { label: '-1R to 0R', min: -1, max: 0 },
    { label: '0R to 1R', min: 0, max: 1 },
    { label: '1R to 2R', min: 1, max: 2 },
    { label: '> 2R', min: 2, max: Infinity },
  ]

  const rDistribution = rBuckets.map((bucket) => ({
    label: bucket.label,
    count: rMultiples.filter((r) => r >= bucket.min && r < bucket.max).length,
  }))

  // Duration vs PnL
  const durationVsPnl = allTrades
    .filter((t) => t.durationMinutes !== null)
    .map((t) => ({
      duration: t.durationMinutes!,
      pnl: Math.round(Number(t.netPnl ?? 0) * 100) / 100,
      symbol: t.symbol,
    }))

  return {
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    maxWinStreak,
    maxLossStreak,
    currentStreak,
    rDistribution,
    durationVsPnl,
    totalRisk: Math.round(pnls.filter((p) => p < 0).reduce((s, p) => s + Math.abs(p), 0) * 100) / 100,
  }
}

// ── Psychology Analytics ──────────────────────────────────────────────────────

export async function getPsychologyAnalytics(period: TimePeriod = 'month') {
  const session = await getSession()
  const userId = session.user.id
  const from = getFromDate(period)

  const conditions = [eq(trades.userId, userId), eq(trades.status, 'CLOSED')]
  if (from) conditions.push(gte(trades.openedAt, from))

  const allTrades = await db.query.trades.findMany({ where: and(...conditions) })
  if (allTrades.length === 0) return null

  const byEmotion = new Map<string, { emotion: string; pnl: number; trades: number; wins: number }>()
  for (const t of allTrades) {
    const key = t.emotionTag ?? 'UNTAGGED'
    const pnl = Number(t.netPnl ?? 0)
    const existing = byEmotion.get(key) ?? { emotion: key, pnl: 0, trades: 0, wins: 0 }
    byEmotion.set(key, {
      emotion: key,
      pnl: existing.pnl + pnl,
      trades: existing.trades + 1,
      wins: existing.wins + (pnl > 0 ? 1 : 0),
    })
  }

  const emotionStats = Array.from(byEmotion.values())
    .sort((a, b) => b.trades - a.trades)
    .map((e) => ({
      ...e,
      pnl: Math.round(e.pnl * 100) / 100,
      winRate: Math.round((e.wins / e.trades) * 100),
      avgPnl: Math.round((e.pnl / e.trades) * 100) / 100,
    }))

  return { emotionStats }
}