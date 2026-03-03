//src/actions/analytics-report.ts

'use server'

import { headers } from 'next/headers'
import { eq, and, gte } from 'drizzle-orm'
import { db } from '@/db'
import { trades, brokerAccounts } from '@/db/schema'
import { auth } from '@/lib/auth'
import type { TimePeriod } from '@/types/trade'

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

function getFromDate(period: TimePeriod): Date | null {
  if (period === 'all') return null
  const from = new Date()
  if (period === 'day') from.setHours(0, 0, 0, 0)
  else if (period === 'week') from.setDate(from.getDate() - 7)
  else if (period === 'month') from.setMonth(from.getMonth() - 1)
  else if (period === 'quarter') from.setMonth(from.getMonth() - 3)
  else if (period === 'year') from.setFullYear(from.getFullYear() - 1)
  return from
}

// Sharpe ratio — (avg return - risk free rate) / std dev of returns
function calcSharpe(returns: number[], riskFreeRate = 0): number {
  if (returns.length < 2) return 0
  const avg = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((s, r) => s + Math.pow(r - avg, 2), 0) / (returns.length - 1)
  const stdDev = Math.sqrt(variance)
  if (stdDev === 0) return 0
  return Math.round(((avg - riskFreeRate) / stdDev) * 1000) / 1000
}

// Sortino ratio — samo negativni returns u denominator
function calcSortino(returns: number[], riskFreeRate = 0): number {
  if (returns.length < 2) return 0
  const avg = returns.reduce((a, b) => a + b, 0) / returns.length
  const negReturns = returns.filter(r => r < riskFreeRate)
  if (negReturns.length === 0) return 0
  const downVar = negReturns.reduce((s, r) => s + Math.pow(r - riskFreeRate, 2), 0) / negReturns.length
  const downDev = Math.sqrt(downVar)
  if (downDev === 0) return 0
  return Math.round(((avg - riskFreeRate) / downDev) * 1000) / 1000
}

// CAGR — Compound Annual Growth Rate
function calcCAGR(initialBalance: number, finalBalance: number, years: number): number {
  if (years < 0.01 || initialBalance === 0 || finalBalance <= 0) return 0
  if (years > 50) return 0 // zaštita od ekstrema
  const result = (Math.pow(finalBalance / initialBalance, 1 / years) - 1) * 100
  if (!isFinite(result) || isNaN(result)) return 0
  return Math.round(result * 100) / 100
}

// Max Drawdown — close to close
function calcMaxDrawdown(pnlSeries: number[]): {
  maxDD: number
  maxDDPercent: number
  avgDD: number
  avgDDDays: number
} {
  if (pnlSeries.length === 0) return { maxDD: 0, maxDDPercent: 0, avgDD: 0, avgDDDays: 0 }

  let peak = 0
  let cumPnl = 0
  let maxDD = 0
  const drawdowns: number[] = []

  for (const pnl of pnlSeries) {
    cumPnl += pnl
    if (cumPnl > peak) peak = cumPnl
    const dd = peak - cumPnl
    if (dd > 0) drawdowns.push(dd)
    if (dd > maxDD) maxDD = dd
  }

  const avgDD = drawdowns.length > 0
    ? drawdowns.reduce((a, b) => a + b, 0) / drawdowns.length
    : 0

  return {
    maxDD: Math.round(maxDD * 100) / 100,
    maxDDPercent: peak > 0 ? Math.round((maxDD / peak) * 10000) / 100 : 0,
    avgDD: Math.round(avgDD * 100) / 100,
    avgDDDays: drawdowns.length > 0 ? Math.round(pnlSeries.length / drawdowns.length) : 0,
  }
}

// Max Run-up
function calcMaxRunup(pnlSeries: number[], initialCapital: number): {
  maxRunup: number
  maxRunupPercent: number
  avgRunup: number
  avgRunupDays: number
} {
  if (pnlSeries.length === 0) return { maxRunup: 0, maxRunupPercent: 0, avgRunup: 0, avgRunupDays: 0 }

  let trough = 0
  let cumPnl = 0
  let maxRunup = 0
  const runups: number[] = []

  for (const pnl of pnlSeries) {
    cumPnl += pnl
    if (cumPnl < trough) trough = cumPnl
    const ru = cumPnl - trough
    if (ru > 0) runups.push(ru)
    if (ru > maxRunup) maxRunup = ru
  }

  const avgRunup = runups.length > 0
    ? runups.reduce((a, b) => a + b, 0) / runups.length
    : 0

  return {
    maxRunup: Math.round(maxRunup * 100) / 100,
    maxRunupPercent: initialCapital > 0
      ? Math.round((maxRunup / initialCapital) * 10000) / 100
      : 0,
    avgRunup: Math.round(avgRunup * 100) / 100,
    avgRunupDays: runups.length > 0 ? Math.round(pnlSeries.length / runups.length) : 0,
  }
}

export async function getAnalyticsReport(period: TimePeriod = 'all') {
  const session = await getSession()
  const userId = session.user.id
  const from = getFromDate(period)

  // Dohvati initial balance iz default broker accounta
  const account = await db.query.brokerAccounts.findFirst({
    where: and(
      eq(brokerAccounts.userId, userId),
      eq(brokerAccounts.isDefault, true)
    ),
  })
  const initialCapital = Number(account?.initialBalance ?? 10000)

  // Svi tradovi
  const conditions = [eq(trades.userId, userId)]
  if (from) conditions.push(gte(trades.openedAt, from))

  const allTrades = await db.query.trades.findMany({
    where: and(...conditions),
    orderBy: (t, { asc }) => [asc(t.openedAt)],
  })

  const closedTrades = allTrades.filter(t => t.status === 'CLOSED')
  const openTrades   = allTrades.filter(t => t.status === 'OPEN')

  // Long / Short split
  const longTrades  = closedTrades.filter(t => t.direction === 'LONG')
  const shortTrades = closedTrades.filter(t => t.direction === 'SHORT')

  function calcStats(subset: typeof closedTrades) {
    if (subset.length === 0) return null

    const winners   = subset.filter(t => Number(t.netPnl ?? 0) > 0)
    const losers    = subset.filter(t => Number(t.netPnl ?? 0) < 0)
    const breakeven = subset.filter(t => Number(t.netPnl ?? 0) === 0)

    const totalNetPnl   = subset.reduce((s, t) => s + Number(t.netPnl ?? 0), 0)
    const grossProfit   = winners.reduce((s, t) => s + Number(t.netPnl ?? 0), 0)
    const grossLoss     = Math.abs(losers.reduce((s, t) => s + Number(t.netPnl ?? 0), 0))
    const totalComm     = subset.reduce((s, t) => s + Number(t.commission ?? 0), 0)
    const profitFactor  = grossLoss === 0 ? grossProfit : grossProfit / grossLoss

    const winRate  = Math.round((winners.length / subset.length) * 10000) / 100
    const avgWin   = winners.length > 0 ? grossProfit / winners.length : 0
    const avgLoss  = losers.length > 0 ? grossLoss / losers.length : 0
    const expectedPayoff = (winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss

    const largestWin  = winners.length > 0 ? Math.max(...winners.map(t => Number(t.netPnl ?? 0))) : 0
    const largestLoss = losers.length > 0 ? Math.max(...losers.map(t => Math.abs(Number(t.netPnl ?? 0)))) : 0

    // P&L kao % od initialCapital
    const totalNetPnlPct   = Math.round((totalNetPnl / initialCapital) * 10000) / 100
    const grossProfitPct   = Math.round((grossProfit / initialCapital) * 10000) / 100
    const grossLossPct     = Math.round((grossLoss / initialCapital) * 10000) / 100
    const avgWinPct        = Math.round((avgWin / initialCapital) * 10000) / 100
    const avgLossPct       = Math.round((avgLoss / initialCapital) * 10000) / 100
    const largestWinPct    = Math.round((largestWin / initialCapital) * 10000) / 100
    const largestLossPct   = Math.round((largestLoss / initialCapital) * 10000) / 100

    // Largest winner/loser as % of gross
    const largestWinOfGross  = grossProfit > 0 ? Math.round((largestWin / grossProfit) * 10000) / 100 : 0
    const largestLossOfGross = grossLoss > 0 ? Math.round((largestLoss / grossLoss) * 10000) / 100 : 0

    // Avg duration in bars (minutes → bars, 1 bar = 1 minute za simplifikaciju)
    const avgBars        = Math.round(subset.reduce((s, t) => s + (t.durationMinutes ?? 0), 0) / subset.length)
    const avgBarsWinners = winners.length > 0
      ? Math.round(winners.reduce((s, t) => s + (t.durationMinutes ?? 0), 0) / winners.length)
      : 0
    const avgBarsLosers  = losers.length > 0
      ? Math.round(losers.reduce((s, t) => s + (t.durationMinutes ?? 0), 0) / losers.length)
      : 0

    // Returns kao % za Sharpe/Sortino
    const returns = subset.map(t => Number(t.netPnl ?? 0) / initialCapital * 100)
    const sharpe  = calcSharpe(returns)
    const sortino = calcSortino(returns)

    // PnL series za drawdown/runup
    const pnlSeries = subset.map(t => Number(t.netPnl ?? 0))
    const ddStats   = calcMaxDrawdown(pnlSeries)
    const ruStats   = calcMaxRunup(pnlSeries)

    // CAGR
    const firstDate = subset[0]?.openedAt
    const lastDate  = subset[subset.length - 1]?.closedAt ?? subset[subset.length - 1]?.openedAt
    const years = firstDate && lastDate
      ? (new Date(lastDate).getTime() - new Date(firstDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      : 0
    const cagr = calcCAGR(initialCapital, initialCapital + totalNetPnl, years)

    // Return on initial capital
    const returnOnCapital = totalNetPnlPct

    // Net profit as % of largest loss
    const netProfitVsLargestLoss = largestLoss > 0
      ? Math.round((totalNetPnl / largestLoss) * 10000) / 100
      : 0

    return {
      totalTrades: subset.length,
      winningTrades: winners.length,
      losingTrades: losers.length,
      breakevenTrades: breakeven.length,
      winRate,
      totalNetPnl: Math.round(totalNetPnl * 100) / 100,
      totalNetPnlPct,
      grossProfit: Math.round(grossProfit * 100) / 100,
      grossProfitPct,
      grossLoss: Math.round(grossLoss * 100) / 100,
      grossLossPct,
      totalCommission: Math.round(totalComm * 100) / 100,
      profitFactor: Math.round(profitFactor * 1000) / 1000,
      expectedPayoff: Math.round(expectedPayoff * 100) / 100,
      expectedPayoffPct: Math.round((expectedPayoff / initialCapital) * 10000) / 100,
      avgWin: Math.round(avgWin * 100) / 100,
      avgWinPct,
      avgLoss: Math.round(avgLoss * 100) / 100,
      avgLossPct,
      ratioAvgWinLoss: avgLoss > 0 ? Math.round((avgWin / avgLoss) * 1000) / 1000 : 0,
      largestWin: Math.round(largestWin * 100) / 100,
      largestWinPct,
      largestWinOfGross,
      largestLoss: Math.round(largestLoss * 100) / 100,
      largestLossPct,
      largestLossOfGross,
      avgBars,
      avgBarsWinners,
      avgBarsLosers,
      sharpe,
      sortino,
      cagr,
      returnOnCapital,
      netProfitVsLargestLoss,
      maxDrawdown: ddStats.maxDD,
      maxDrawdownPct: ddStats.maxDDPercent,
      avgDrawdown: ddStats.avgDD,
      avgDrawdownDays: ddStats.avgDDDays,
      maxRunup: ruStats.maxRunup,
      maxRunupPct: ruStats.maxRunupPercent,
      avgRunup: ruStats.avgRunup,
      avgRunupDays: ruStats.avgRunupDays,
    }
  }

  // Open P&L
  const openPnl = openTrades.reduce((s, t) => s + Number(t.netPnl ?? 0), 0)

  // Buy & Hold benchmark — simuliramo da smo kupili na prvom tradu i zadržali
  const firstTrade  = closedTrades[0]
  const lastTrade   = closedTrades[closedTrades.length - 1]
  let buyHoldReturn = 0
  let buyHoldPct    = 0
  if (firstTrade && lastTrade && firstTrade.entryPrice && lastTrade.exitPrice) {
    const entryP = Number(firstTrade.entryPrice)
    const exitP  = Number(lastTrade.exitPrice ?? lastTrade.entryPrice)
    buyHoldReturn   = Math.round(((exitP - entryP) / entryP) * initialCapital * 100) / 100
    buyHoldPct      = Math.round(((exitP - entryP) / entryP) * 10000) / 100
  }

  const allStats   = calcStats(closedTrades)
  const longStats  = calcStats(longTrades)
  const shortStats = calcStats(shortTrades)

  const strategyOutperformance = allStats
    ? Math.round((allStats.totalNetPnl - buyHoldReturn) * 100) / 100
    : 0

  // Account size required = initial capital + max drawdown (intrabar approx)
const accountSizeRequired = allStats
  ? Math.round((initialCapital + allStats.maxDrawdown) * 100) / 100
  : initialCapital

  return {
    initialCapital,
    openPnl: Math.round(openPnl * 100) / 100,
    openPnlPct: Math.round((openPnl / initialCapital) * 10000) / 100,
    openTradesCount: openTrades.length,
    buyHoldReturn,
    buyHoldPct,
    strategyOutperformance,
    accountSizeRequired,
    all: allStats,
    long: longStats,
    short: shortStats,
  }
}