//src/actions/leaderboard.ts

'use server'

import { eq, and, ne } from 'drizzle-orm'
import { db } from '@/db'
import { users, trades } from '@/db/schema'

export type LeaderboardSortKey =
  | 'equity'
  | 'growthPercent'
  | 'winRate'
  | 'totalTrades'
  | 'profitFactor'
  | 'expectancy'
  | 'avgRMultiple'
  | 'totalNetPnl'

export type LeaderboardSortDir = 'asc' | 'desc'

export interface LeaderboardEntry {
  rank: number
  userId: string
  nickname: string
  maskedEmail: string
  totalTrades: number
  winningTrades: number
  losingTrades: number
  winRate: number
  totalNetPnl: number
  growthPercent: number
  profitFactor: number
  expectancy: number
  avgRMultiple: number
  bestTrade: number
  worstTrade: number
  equity: number       // kumulativni P&L (od 0)
  initialBalance: number
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***@***.***'
  const visible = local.slice(0, 2)
  const masked = '*'.repeat(Math.max(2, local.length - 2))
  const [domainName, tld] = domain.split('.')
  const maskedDomain = domainName
    ? domainName.slice(0, 1) + '*'.repeat(Math.max(1, domainName.length - 1))
    : '***'
  return `${visible}${masked}@${maskedDomain}.${tld ?? '***'}`
}

function generateNickname(name: string | null, email: string): string {
  if (name) {
    // Uzmi inicijale + zadnje 3 cifre iz emaila
    const parts = name.trim().split(' ')
    const initials = parts.map(p => p[0]?.toUpperCase() ?? '').join('')
    const emailHash = email.replace(/[^0-9]/g, '').slice(-3).padStart(3, '0')
    return `${initials}${emailHash}`
  }
  // Fallback — prve 3 slova emaila + hash
  return email.slice(0, 3).toUpperCase() + email.replace(/[^0-9]/g, '').slice(-3).padStart(3, '0')
}

export async function getLeaderboard(
  sortBy: LeaderboardSortKey = 'equity',
  sortDir: LeaderboardSortDir = 'desc'
): Promise<LeaderboardEntry[]> {

  // Dohvati sve korisnike koji žele biti na leaderboardu
  const allUsers = await db.query.users.findMany({
    where: eq(users.showOnLeaderboard, true),
  })

  if (allUsers.length === 0) return []

  // Dohvati sve zatvorene tradove za sve korisnike odjednom
  const allTrades = await db.query.trades.findMany({
    where: eq(trades.status, 'CLOSED'),
  })

  // Grupiši tradove po userId
  const tradesByUser = new Map<string, typeof allTrades>()
  for (const trade of allTrades) {
    const existing = tradesByUser.get(trade.userId) ?? []
    existing.push(trade)
    tradesByUser.set(trade.userId, existing)
  }

  const entries: LeaderboardEntry[] = []

  for (const user of allUsers) {
    const userTrades = tradesByUser.get(user.id) ?? []

    // Minimum 1 trade da bi bio na leaderboardu
    if (userTrades.length === 0) continue

    const winners = userTrades.filter(t => Number(t.netPnl ?? 0) > 0)
    const losers  = userTrades.filter(t => Number(t.netPnl ?? 0) < 0)

    const totalNetPnl = userTrades.reduce((s, t) => s + Number(t.netPnl ?? 0), 0)
    const grossWins   = winners.reduce((s, t) => s + Number(t.netPnl ?? 0), 0)
    const grossLosses = Math.abs(losers.reduce((s, t) => s + Number(t.netPnl ?? 0), 0))

    const winRate      = Math.round((winners.length / userTrades.length) * 1000) / 10
    const profitFactor = grossLosses === 0 ? grossWins : Math.round((grossWins / grossLosses) * 100) / 100
    const avgWin       = winners.length > 0 ? grossWins / winners.length : 0
    const avgLoss      = losers.length  > 0 ? grossLosses / losers.length : 0
    const expectancy   = Math.round(((winRate / 100) * avgWin - ((100 - winRate) / 100) * avgLoss) * 100) / 100

    const rMultiples   = userTrades.filter(t => t.rMultiple !== null).map(t => Number(t.rMultiple))
    const avgRMultiple = rMultiples.length > 0
      ? Math.round((rMultiples.reduce((a, b) => a + b, 0) / rMultiples.length) * 100) / 100
      : 0

    const bestTrade  = winners.length > 0 ? Math.max(...winners.map(t => Number(t.netPnl ?? 0))) : 0
    const worstTrade = losers.length  > 0 ? Math.min(...losers.map(t => Number(t.netPnl ?? 0))) : 0

    // Equity = kumulativni P&L od 0
    const equity = Math.round(totalNetPnl * 100) / 100

    // Growth % = (totalNetPnl / initialBalance) * 100
    // Koristimo 10000 kao default ako nema broker accounta
    const initialBalance = 10000
    const growthPercent = Math.round((totalNetPnl / initialBalance) * 10000) / 100

    // Nickname — koristi custom nickname ako postoji, inače generiši
    const nickname = (user as any).nickname
      ? (user as any).nickname
      : generateNickname(user.name, user.email)

    entries.push({
      userId: user.id,
      rank: 0, // popunjava se nakon sortiranja
      nickname,
      maskedEmail: maskEmail(user.email),
      totalTrades: userTrades.length,
      winningTrades: winners.length,
      losingTrades: losers.length,
      winRate,
      totalNetPnl: Math.round(totalNetPnl * 100) / 100,
      growthPercent,
      profitFactor,
      expectancy,
      avgRMultiple,
      bestTrade: Math.round(bestTrade * 100) / 100,
      worstTrade: Math.round(worstTrade * 100) / 100,
      equity,
      initialBalance,
    })
  }

  // Sortiranje
  entries.sort((a, b) => {
    const aVal = a[sortBy]
    const bVal = b[sortBy]
    return sortDir === 'desc' ? bVal - aVal : aVal - bVal
  })

  // Dodijeli rankove nakon sortiranja
  entries.forEach((e, i) => { e.rank = i + 1 })

  return entries
}