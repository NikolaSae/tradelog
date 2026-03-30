//src/actions/trades.ts

'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm'
import { db } from '@/db'
import { trades, brokerAccounts } from '@/db/schema'
import { auth } from '@/lib/auth'
import { tradeFormSchema } from '@/lib/validators/trade'
import { PLANS } from '@/config/plans'
import type { TradeFormValues } from '@/lib/validators/trade'
import type { TimePeriod } from '@/types/trade'
import { checkAlertsForCurrentUser } from '@/actions/alerts'

const VALID_PERIODS = ['day', 'week', 'month', 'quarter', 'year', 'all'] as const
const VALID_DIRECTIONS = ['LONG', 'SHORT'] as const
const VALID_STATUSES = ['OPEN', 'CLOSED', 'BREAKEVEN', 'PARTIALLY_CLOSED'] as const

function validatePeriod(period: unknown): TimePeriod {
  if (!VALID_PERIODS.includes(period as TimePeriod)) throw new Error('Invalid period')
  return period as TimePeriod
}

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

async function getDefaultAccount(userId: string) {
  const existing = await db.query.brokerAccounts.findFirst({
    where: and(
      eq(brokerAccounts.userId, userId),
      eq(brokerAccounts.isDefault, true)
    ),
  })
  if (existing) return existing

  const account = {
    id: nanoid(),
    userId,
    name: 'Default Account',
    currency: 'USD',
    initialBalance: '10000',
    currentBalance: '10000',
    isDefault: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
  await db.insert(brokerAccounts).values(account)
  return account
}

function getContractSize(symbol: string): number {
  const s = symbol.toUpperCase()
  if (s.includes('XAU') || s === 'GOLD') return 100
  if (s.includes('XAG') || s === 'SILVER') return 5000
  if (s.includes('XPT') || s.includes('XPD')) return 100
  if (s.includes('BTC')) return 1
  if (s.includes('ETH')) return 1
  if (s.includes('NAS') || s.includes('US100') || s.includes('NQ')) return 20
  if (s.includes('SPX') || s.includes('US500') || s.includes('SP500')) return 50
  if (s.includes('DOW') || s.includes('US30')) return 5
  if (s.includes('GER') || s.includes('DAX')) return 25
  if (s.includes('UK100') || s.includes('FTSE')) return 10
  if (s.includes('OIL') || s.includes('WTI') || s.includes('BRENT')) return 1000
  if (s.includes('GAS')) return 10000
  return 100000
}

function calculatePnl(
  direction: 'LONG' | 'SHORT',
  entryPrice: number,
  exitPrice: number,
  lotSize: number,
  commission: number,
  swap: number,
  symbol: string
) {
  const contractSize = getContractSize(symbol)
  const priceDiff = direction === 'LONG'
    ? exitPrice - entryPrice
    : entryPrice - exitPrice
  const grossPnl = priceDiff * lotSize * contractSize
  const netPnl = grossPnl - commission - Math.abs(swap)
  return {
    grossPnl: grossPnl.toFixed(2),
    netPnl: netPnl.toFixed(2),
  }
}

function calculateRMultiple(
  direction: 'LONG' | 'SHORT',
  entryPrice: number,
  exitPrice: number,
  stopLoss: number | undefined
): string | null {
  if (!stopLoss) return null
  const risk = Math.abs(entryPrice - stopLoss)
  if (risk === 0) return null
  const reward = direction === 'LONG'
    ? exitPrice - entryPrice
    : entryPrice - exitPrice
  return (reward / risk).toFixed(2)
}

function calculateDurationSeconds(openedAt: Date, closedAt: Date): number {
  return Math.floor((closedAt.getTime() - openedAt.getTime()) / 1000)
}

function calculateDurationMinutes(openedAt: Date, closedAt: Date): number {
  return Math.floor((closedAt.getTime() - openedAt.getTime()) / 60000)
}

export async function createTrade(values: TradeFormValues) {
  const session = await getSession()
  const userId = session.user.id
  const userPlan = ((session.user as any).plan ?? 'FREE') as keyof typeof PLANS

  if (userPlan === 'FREE') {
    const count = await db
      .select({ count: sql<number>`count(*)` })
      .from(trades)
      .where(eq(trades.userId, userId))

    const tradeCount = Number(count[0]?.count ?? 0)
    if (tradeCount >= PLANS.FREE.maxTrades) {
      return {
        error: `Free plan is limited to ${PLANS.FREE.maxTrades} trades. Upgrade to Pro for unlimited trades.`,
      }
    }
  }

  const parsed = tradeFormSchema.safeParse(values)
  if (!parsed.success) {
    return { error: 'Invalid trade data' } // generička poruka
  }

  const data = parsed.data
  const account = await getDefaultAccount(userId)

  const openedAt = new Date(data.openedAt)
  const closedAt = data.closedAt ? new Date(data.closedAt) : null

  let grossPnl = null
  let netPnl = null
  let rMultiple = null
  let durationMinutes = null
  let durationSeconds = null

  if (data.exitPrice && data.status !== 'OPEN') {
    const pnl = calculatePnl(
      data.direction,
      data.entryPrice,
      data.exitPrice,
      data.lotSize,
      data.commission,
      data.swap,
      data.symbol
    )
    grossPnl = pnl.grossPnl
    netPnl = pnl.netPnl
    rMultiple = calculateRMultiple(
      data.direction,
      data.entryPrice,
      data.exitPrice,
      data.stopLoss
    )
  }

  if (closedAt) {
  durationSeconds = calculateDurationSeconds(openedAt, closedAt)
  durationMinutes = Math.floor(durationSeconds / 60)
}

  const trade = {
    id: nanoid(),
    userId,
    accountId: account.id,
    symbol: data.symbol,
    direction: data.direction,
    status: data.status,
    session: data.session ?? null,
    entryPrice: data.entryPrice.toString(),
    exitPrice: data.exitPrice?.toString() ?? null,
    stopLoss: data.stopLoss?.toString() ?? null,
    takeProfit: data.takeProfit?.toString() ?? null,
    lotSize: data.lotSize.toString(),
    commission: data.commission.toString(),
    swap: data.swap.toString(),
    grossPnl,
    netPnl,
    rMultiple,
    riskAmount: null,
    openedAt,
    closedAt,
    durationMinutes,
    durationSeconds,
    mae: null,
    mfe: null,
    plannedEntry: null,
    slippage: null,
    setupId: data.setupId ?? null,
    emotionTag: data.emotionTag ?? null,
    checklistPassed: null,
    aiScore: null,
    notes: data.notes ?? null,
    externalId: null,
    importSource: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  await db.insert(trades).values(trade)
  revalidatePath('/trades')
  revalidatePath('/dashboard')
  await checkAlertsForCurrentUser()
  return { success: true, id: trade.id }
}

export async function updateTrade(id: string, values: TradeFormValues) {
  const session = await getSession()
  const userId = session.user.id

  // Validacija ID formata
  if (!id || id.length > 50) return { error: 'Invalid trade ID' }

  const parsed = tradeFormSchema.safeParse(values)
  if (!parsed.success) {
    return { error: 'Invalid trade data' }
  }

  const data = parsed.data
  const openedAt = new Date(data.openedAt)
  const closedAt = data.closedAt ? new Date(data.closedAt) : null

  let grossPnl = null
  let netPnl = null
  let rMultiple = null
  let durationMinutes = null
  let durationSeconds = null

  if (data.exitPrice && data.status !== 'OPEN') {
    const pnl = calculatePnl(
      data.direction,
      data.entryPrice,
      data.exitPrice,
      data.lotSize,
      data.commission,
      data.swap,
      data.symbol
    )
    grossPnl = pnl.grossPnl
    netPnl = pnl.netPnl
    rMultiple = calculateRMultiple(
      data.direction,
      data.entryPrice,
      data.exitPrice,
      data.stopLoss
    )
  }

  if (closedAt) {
    durationSeconds = calculateDurationSeconds(openedAt, closedAt)
    durationMinutes = Math.floor(durationSeconds / 60)
}

  await db
    .update(trades)
    .set({
      symbol: data.symbol,
      direction: data.direction,
      status: data.status,
      session: data.session ?? null,
      entryPrice: data.entryPrice.toString(),
      exitPrice: data.exitPrice?.toString() ?? null,
      stopLoss: data.stopLoss?.toString() ?? null,
      takeProfit: data.takeProfit?.toString() ?? null,
      lotSize: data.lotSize.toString(),
      commission: data.commission.toString(),
      swap: data.swap.toString(),
      grossPnl,
      netPnl,
      rMultiple,
      openedAt,
      closedAt,
      durationMinutes,
      durationSeconds,
      emotionTag: data.emotionTag ?? null,
      notes: data.notes ?? null,
      setupId: data.setupId ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(trades.id, id), eq(trades.userId, userId)))

  revalidatePath('/trades')
  revalidatePath(`/trades/${id}`)
  revalidatePath('/dashboard')
  return { success: true }
}

export async function deleteTrade(id: string) {
  const session = await getSession()
  const userId = session.user.id

  if (!id || id.length > 50) return { error: 'Invalid trade ID' }

  await db
    .delete(trades)
    .where(and(eq(trades.id, id), eq(trades.userId, userId)))

  revalidatePath('/trades')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function getTrades({
  period = 'all',
  symbol,
  direction,
  status,
  page = 1,
  limit = 20,
}: {
  period?: TimePeriod
  symbol?: string
  direction?: 'LONG' | 'SHORT'
  status?: string
  page?: number
  limit?: number
} = {}) {
  const session = await getSession()
  const userId = session.user.id

  // Validacija svih parametara
  const safePeriod = VALID_PERIODS.includes(period as TimePeriod) ? period : 'all'
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 100)
  const safePage = Math.max(1, Math.floor(page))
  const safeSymbol = symbol
    ? symbol.trim().toUpperCase().slice(0, 20)
    : undefined
  const safeDirection = direction && VALID_DIRECTIONS.includes(direction)
    ? direction
    : undefined
  const safeStatus = status && VALID_STATUSES.includes(status as any)
    ? status
    : undefined

  const conditions = [eq(trades.userId, userId)]

  if (safePeriod !== 'all') {
    const now = new Date()
    const from = new Date()
    if (safePeriod === 'day') from.setHours(0, 0, 0, 0)
    else if (safePeriod === 'week') from.setDate(now.getDate() - 7)
    else if (safePeriod === 'month') from.setMonth(now.getMonth() - 1)
    else if (safePeriod === 'quarter') from.setMonth(now.getMonth() - 3)
    else if (safePeriod === 'year') from.setFullYear(now.getFullYear() - 1)
    conditions.push(gte(trades.openedAt, from))
  }

  if (safeSymbol) conditions.push(eq(trades.symbol, safeSymbol))
  if (safeDirection) conditions.push(eq(trades.direction, safeDirection))
  if (safeStatus) conditions.push(eq(trades.status, safeStatus as any))

  const offset = (safePage - 1) * safeLimit

  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(trades)
    .where(and(...conditions))

  const total = Number(totalResult[0]?.count ?? 0)

  const result = await db.query.trades.findMany({
    where: and(...conditions),
    orderBy: [desc(trades.openedAt)],
    limit: safeLimit,
    offset,
  })

  return {
    trades: result,
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.ceil(total / safeLimit),
  }
}

export async function getTradeSymbols() {
  const session = await getSession()
  const userId = session.user.id

  const result = await db
    .selectDistinct({ symbol: trades.symbol })
    .from(trades)
    .where(eq(trades.userId, userId))
    .orderBy(trades.symbol)

  return result.map(r => r.symbol)
}

export async function getTrade(id: string) {
  const session = await getSession()
  const userId = session.user.id

  if (!id || id.length > 50) return null

  return db.query.trades.findFirst({
    where: and(eq(trades.id, id), eq(trades.userId, userId)),
  }) ?? null
}

export async function getTradeStats(period: TimePeriod = 'month') {
  const session = await getSession()
  const userId = session.user.id

  // Validacija period-a
  const safePeriod = VALID_PERIODS.includes(period as TimePeriod) ? period : 'month'

  const now = new Date()
  const from = new Date()
  if (safePeriod === 'day') from.setHours(0, 0, 0, 0)
  else if (safePeriod === 'week') from.setDate(now.getDate() - 7)
  else if (safePeriod === 'month') from.setMonth(now.getMonth() - 1)
  else if (safePeriod === 'quarter') from.setMonth(now.getMonth() - 3)
  else if (safePeriod === 'year') from.setFullYear(now.getFullYear() - 1)

  const conditions = [
    eq(trades.userId, userId),
    eq(trades.status, 'CLOSED'),
  ]
  if (safePeriod !== 'all') {
    conditions.push(gte(trades.openedAt, from))
  }

  const allTrades = await db.query.trades.findMany({
    where: and(...conditions),
  })

  if (allTrades.length === 0) {
    return {
      totalTrades: 0, winningTrades: 0, losingTrades: 0,
      winRate: 0, totalNetPnl: 0, totalGrossPnl: 0,
      totalCommission: 0, avgNetPnl: 0, avgWin: 0, avgLoss: 0,
      profitFactor: 0, expectancy: 0, largestWin: 0, largestLoss: 0,
      avgRMultiple: 0, tradingDays: 0, grossWinTotal: 0, grossLossTotal: 0,
    }
  }

  const winners = allTrades.filter(t => Number(t.netPnl ?? 0) > 0)
  const losers  = allTrades.filter(t => Number(t.netPnl ?? 0) < 0)

  const totalNetPnl     = allTrades.reduce((sum, t) => sum + Number(t.netPnl ?? 0), 0)
  const totalGrossPnl   = allTrades.reduce((sum, t) => sum + Number(t.grossPnl ?? 0), 0)
  const totalCommission = allTrades.reduce((sum, t) => sum + Number(t.commission ?? 0), 0)

  const grossWins   = winners.reduce((sum, t) => sum + Number(t.netPnl ?? 0), 0)
  const grossLosses = Math.abs(losers.reduce((sum, t) => sum + Number(t.netPnl ?? 0), 0))

  const profitFactor = grossLosses === 0 ? grossWins : grossWins / grossLosses
  const winRate = (winners.length / allTrades.length) * 100
  const avgWin  = winners.length > 0 ? grossWins / winners.length : 0
  const avgLoss = losers.length  > 0 ? grossLosses / losers.length : 0
  const expectancy = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss

  const rMultiples = allTrades
    .filter(t => t.rMultiple !== null)
    .map(t => Number(t.rMultiple))
  const avgRMultiple = rMultiples.length > 0
    ? rMultiples.reduce((a, b) => a + b, 0) / rMultiples.length
    : 0

  const tradingDays = new Set(
    allTrades.map(t => {
      const d = t.closedAt ?? t.openedAt
      return d ? d.toISOString().split('T')[0] : null
    }).filter(Boolean)
  ).size

  return {
    totalTrades: allTrades.length,
    winningTrades: winners.length,
    losingTrades: losers.length,
    winRate: Math.round(winRate * 10) / 10,
    totalNetPnl: Math.round(totalNetPnl * 100) / 100,
    totalGrossPnl: Math.round(totalGrossPnl * 100) / 100,
    totalCommission: Math.round(totalCommission * 100) / 100,
    avgNetPnl: Math.round((totalNetPnl / allTrades.length) * 100) / 100,
    avgWin: Math.round(avgWin * 100) / 100,
    avgLoss: Math.round(avgLoss * 100) / 100,
    profitFactor: Math.round(profitFactor * 100) / 100,
    expectancy: Math.round(expectancy * 100) / 100,
    largestWin: winners.length > 0
      ? Math.round(Math.max(...winners.map(t => Number(t.netPnl ?? 0))) * 100) / 100
      : 0,
    largestLoss: losers.length > 0
      ? Math.round(Math.min(...losers.map(t => Number(t.netPnl ?? 0))) * 100) / 100
      : 0,
    avgRMultiple: Math.round(avgRMultiple * 100) / 100,
    tradingDays,
    grossWinTotal: Math.round(grossWins * 100) / 100,
    grossLossTotal: Math.round(grossLosses * 100) / 100,
  }
}