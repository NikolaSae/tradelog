//src/app/api/cron/weekly-digest/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { eq, gte, and } from 'drizzle-orm'
import { db } from '@/db'
import { users, trades } from '@/db/schema'
import { sendWeeklyDigestEmail } from '@/lib/email/send'

// Zaštiti sa secret tokenom
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Dohvati sve korisnike
  const allUsers = await db.query.users.findMany()

  let sent = 0

  for (const user of allUsers) {
    try {
      // Dohvati tradove za prošlu sedmicu
      const weekTrades = await db.query.trades.findMany({
        where: and(
          eq(trades.userId, user.id),
          eq(trades.status, 'CLOSED'),
          gte(trades.openedAt, weekAgo)
        ),
      })

      if (weekTrades.length === 0) continue

      // Kalkuliši stats
      const winners = weekTrades.filter(t => Number(t.netPnl ?? 0) > 0)
      const losers = weekTrades.filter(t => Number(t.netPnl ?? 0) <= 0)
      const netPnl = weekTrades.reduce((s, t) => s + Number(t.netPnl ?? 0), 0)
      const grossWins = winners.reduce((s, t) => s + Number(t.netPnl ?? 0), 0)
      const grossLosses = Math.abs(losers.reduce((s, t) => s + Number(t.netPnl ?? 0), 0))
      const profitFactor = grossLosses === 0 ? grossWins : grossWins / grossLosses
      const winRate = weekTrades.length > 0
        ? Math.round((winners.length / weekTrades.length) * 1000) / 10
        : 0

      // Best/worst symbol
      const bySymbol = new Map<string, number>()
      for (const t of weekTrades) {
        bySymbol.set(t.symbol, (bySymbol.get(t.symbol) ?? 0) + Number(t.netPnl ?? 0))
      }
      const symbolEntries = Array.from(bySymbol.entries())
      const bestSymbol = symbolEntries.sort((a, b) => b[1] - a[1])[0]?.[0]
      const worstSymbol = symbolEntries.sort((a, b) => a[1] - b[1])[0]?.[0]

      const weekLabel = `${weekAgo.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })} – ${now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`

      await sendWeeklyDigestEmail(
        user.email,
        user.name ?? 'Trader',
        {
          totalTrades: weekTrades.length,
          winRate,
          netPnl: Math.round(netPnl * 100) / 100,
          profitFactor: Math.round(profitFactor * 100) / 100,
          winningTrades: winners.length,
          losingTrades: losers.length,
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