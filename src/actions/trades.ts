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
import { checkAlertsForUser } from '@/actions/alerts'
// Helper: get current session or throw
async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

// Helper: get or create default broker account
async function getDefaultAccount(userId: string) {
  const existing = await db.query.brokerAccounts.findFirst({
    where: and(
      eq(brokerAccounts.userId, userId),
      eq(brokerAccounts.isDefault, true)
    ),
  })
  if (existing) return existing

  // Kreiraj default account ako ne postoji
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

// Helper: calculate P&L
function getContractSize(symbol: string): number {
  const s = symbol.toUpperCase()
  // Metali
  if (s.includes('XAU') || s === 'GOLD') return 100      // Gold — 100 oz
  if (s.includes('XAG') || s === 'SILVER') return 5000   // Silver — 5000 oz
  if (s.includes('XPT') || s.includes('XPD')) return 100
  // Kripto (tipično)
  if (s.includes('BTC')) return 1
  if (s.includes('ETH')) return 1
  // Indeksi (US100, SPX, GER40...)
  if (s.includes('NAS') || s.includes('US100') || s.includes('NQ')) return 20
  if (s.includes('SPX') || s.includes('US500') || s.includes('SP500')) return 50
  if (s.includes('DOW') || s.includes('US30')) return 5
  if (s.includes('GER') || s.includes('DAX')) return 25
  if (s.includes('UK100') || s.includes('FTSE')) return 10
  // Energija
  if (s.includes('OIL') || s.includes('WTI') || s.includes('BRENT')) return 1000
  if (s.includes('GAS')) return 10000
  // Forex default
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

// Helper: calculate R-multiple
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

// Helper: calculate duration in minutes
function calculateDuration(openedAt: Date, closedAt: Date): number {
  return Math.floor((closedAt.getTime() - openedAt.getTime()) / 60000)
}

// ===========================
// CREATE TRADE
// ===========================
export async function createTrade(values: TradeFormValues) {
  const session = await getSession()
  const userId = session.user.id
  const userPlan = ((session.user as any).plan ?? 'FREE') as keyof typeof PLANS

  // Check trade limit for Free plan
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
    return { error: parsed.error.errors[0]?.message ?? 'Invalid data' }
  }

  const data = parsed.data
  const account = await getDefaultAccount(userId)

  const openedAt = new Date(data.openedAt)
  const closedAt = data.closedAt ? new Date(data.closedAt) : null

  // Calculate derived fields
  let grossPnl = null
  let netPnl = null
  let rMultiple = null
  let durationMinutes = null

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
    durationMinutes = calculateDuration(openedAt, closedAt)
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
  checkAlertsForUser(userId).catch(console.error)
  return { success: true, id: trade.id }
}

// ===========================
// UPDATE TRADE
// ===========================
export async function updateTrade(id: string, values: TradeFormValues) {
  const session = await getSession()
  const userId = session.user.id

  const parsed = tradeFormSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid data' }
  }

  const data = parsed.data
  const openedAt = new Date(data.openedAt)
  const closedAt = data.closedAt ? new Date(data.closedAt) : null

  let grossPnl = null
  let netPnl = null
  let rMultiple = null
  let durationMinutes = null

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
    durationMinutes = calculateDuration(openedAt, closedAt)
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

// ===========================
// DELETE TRADE
// ===========================
export async function deleteTrade(id: string) {
  const session = await getSession()
  const userId = session.user.id

  await db
    .delete(trades)
    .where(and(eq(trades.id, id), eq(trades.userId, userId)))

  revalidatePath('/trades')
  revalidatePath('/dashboard')

  return { success: true }
}

// ===========================
// GET TRADES LIST
// ===========================
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

  const conditions = [eq(trades.userId, userId)]

  if (period !== 'all') {
    const now = new Date()
    const from = new Date()
    if (period === 'day') from.setHours(0, 0, 0, 0)
    else if (period === 'week') from.setDate(now.getDate() - 7)
    else if (period === 'month') from.setMonth(now.getMonth() - 1)
    else if (period === 'quarter') from.setMonth(now.getMonth() - 3)
    else if (period === 'year') from.setFullYear(now.getFullYear() - 1)
    conditions.push(gte(trades.openedAt, from))
  }

  if (symbol) conditions.push(eq(trades.symbol, symbol.toUpperCase()))
  if (direction) conditions.push(eq(trades.direction, direction))
  if (status) conditions.push(eq(trades.status, status as any))

  const offset = (page - 1) * limit

  // Ukupan broj za paginaciju
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(trades)
    .where(and(...conditions))

  const total = Number(totalResult[0]?.count ?? 0)

  const result = await db.query.trades.findMany({
    where: and(...conditions),
    orderBy: [desc(trades.openedAt)],
    limit,
    offset,
  })

  return {
    trades: result,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
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

// ===========================
// GET SINGLE TRADE
// ===========================
export async function getTrade(id: string) {
  const session = await getSession()
  const userId = session.user.id

  const trade = await db.query.trades.findFirst({
    where: and(eq(trades.id, id), eq(trades.userId, userId)),
  })

  if (!trade) return null
  return trade
}

// ===========================
// GET TRADE STATS (za dashboard)
// ===========================
export async function getTradeStats(period: TimePeriod = 'month') {
  const session = await getSession()
  const userId = session.user.id
  const now = new Date()
  const from = new Date()
  if (period === 'day') from.setHours(0, 0, 0, 0)
  else if (period === 'week') from.setDate(now.getDate() - 7)
  else if (period === 'month') from.setMonth(now.getMonth() - 1)
  else if (period === 'quarter') from.setMonth(now.getMonth() - 3)
  else if (period === 'year') from.setFullYear(now.getFullYear() - 1)

  const conditions = [
    eq(trades.userId, userId),
    eq(trades.status, 'CLOSED'),
  ]
  if (period !== 'all') {
    conditions.push(gte(trades.openedAt, from))
  }

  const allTrades = await db.query.trades.findMany({
    where: and(...conditions),
  })

  // Empty state — sve nule, nema referenci na nedefinirane varijable
  if (allTrades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      winRate: 0,
      totalNetPnl: 0,
      totalGrossPnl: 0,
      totalCommission: 0,
      avgNetPnl: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      expectancy: 0,
      largestWin: 0,
      largestLoss: 0,
      avgRMultiple: 0,
      tradingDays: 0,
      grossWinTotal: 0,
      grossLossTotal: 0,
    }
  }

  // Kalkulacije — dolaze NAKON early return
  const winners = allTrades.filter(t => Number(t.netPnl ?? 0) > 0)
  const losers  = allTrades.filter(t => Number(t.netPnl ?? 0) < 0)

  const totalNetPnl    = allTrades.reduce((sum, t) => sum + Number(t.netPnl ?? 0), 0)
  const totalGrossPnl  = allTrades.reduce((sum, t) => sum + Number(t.grossPnl ?? 0), 0)
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