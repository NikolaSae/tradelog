//src/app/api/cron/weekly-digest/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { eq, gte, and, sql } from 'drizzle-orm'
import { db } from '@/db'
import { users, trades } from '@/db/schema'
import { sendWeeklyDigestEmail } from '@/lib/email/send'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const weekLabel = `${weekAgo.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`

  // FIX: jedan SQL upit koji agregira stats po korisniku
  // umjesto N+1 (jedan query po korisniku u loopu)
  const digestStats = await db
    .select({
      userId: trades.userId,
      totalTrades:    sql<number>`count(*)`,
      netPnl:         sql<number>`sum(${trades.netPnl}::numeric)`,
      winningTrades:  sql<number>`count(*) filter (where ${trades.netPnl}::numeric > 0)`,
      losingTrades:   sql<number>`count(*) filter (where ${trades.netPnl}::numeric <= 0)`,
      grossWins:      sql<number>`sum(${trades.netPnl}::numeric) filter (where ${trades.netPnl}::numeric > 0)`,
      grossLosses:    sql<number>`abs(sum(${trades.netPnl}::numeric) filter (where ${trades.netPnl}::numeric <= 0))`,
    })
    .from(trades)
    .where(and(
      eq(trades.status, 'CLOSED'),
      gte(trades.openedAt, weekAgo)
    ))
    .groupBy(trades.userId)

  // Korisnici koji imaju bar jedan trade prošle sedmice
  const activeUserIds = digestStats.map(s => s.userId)
  if (activeUserIds.length === 0) {
    return NextResponse.json({ success: true, sent: 0 })
  }

  // Dohvati user podatke samo za aktivne korisnike
  const activeUsers = await db.query.users.findMany({
    where: (u, { inArray }) => inArray(u.id, activeUserIds),
  })
  const usersMap = new Map(activeUsers.map(u => [u.id, u]))

  // FIX: best/worst symbol — jedan upit za sve korisnike odjednom
  const symbolStats = await db
    .select({
      userId: trades.userId,
      symbol: trades.symbol,
      pnl: sql<number>`sum(${trades.netPnl}::numeric)`,
    })
    .from(trades)
    .where(and(
      eq(trades.status, 'CLOSED'),
      gte(trades.openedAt, weekAgo)
    ))
    .groupBy(trades.userId, trades.symbol)

  // Grupiši symbol stats po userId
  const symbolsByUser = new Map<string, { symbol: string; pnl: number }[]>()
  for (const row of symbolStats) {
    if (!symbolsByUser.has(row.userId)) symbolsByUser.set(row.userId, [])
    symbolsByUser.get(row.userId)!.push({ symbol: row.symbol, pnl: Number(row.pnl) })
  }

  let sent = 0

  for (const stat of digestStats) {
    const user = usersMap.get(stat.userId)
    if (!user) continue

    try {
      const totalTrades = Number(stat.totalTrades)
      const winningTrades = Number(stat.winningTrades)
      const losingTrades = Number(stat.losingTrades)
      const netPnl = Math.round(Number(stat.netPnl) * 100) / 100
      const grossWins = Number(stat.grossWins ?? 0)
      const grossLosses = Number(stat.grossLosses ?? 0)
      const profitFactor = grossLosses === 0
        ? grossWins
        : Math.round((grossWins / grossLosses) * 100) / 100
      const winRate = totalTrades > 0
        ? Math.round((winningTrades / totalTrades) * 1000) / 10
        : 0

      // Best/worst symbol iz pre-agregiranog mapa
      const symbols = symbolsByUser.get(stat.userId) ?? []
      const sorted = symbols.sort((a, b) => b.pnl - a.pnl)
      const bestSymbol = sorted[0]?.symbol
      const worstSymbol = sorted.length > 1 ? sorted[sorted.length - 1]?.symbol : undefined

      await sendWeeklyDigestEmail(
        user.email,
        user.name ?? 'Trader',
        {
          totalTrades,
          winRate,
          netPnl,
          profitFactor,
          winningTrades,
          losingTrades,
          bestSymbol,
          worstSymbol: bestSymbol !== worstSymbol ? worstSymbol : undefined,
        },
        weekLabel
      )

      sent++
    } catch (err) {
      console.error(`Failed digest for ${user.email}:`, err)
    }
  }

  return NextResponse.json({ success: true, sent })
}