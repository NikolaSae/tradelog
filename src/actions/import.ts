//src/actions/import.ts

'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { trades, brokerAccounts } from '@/db/schema'
import { auth } from '@/lib/auth'
import { detectAndParse } from '@/lib/import'
import type { ParsedTrade } from '@/lib/import/types'

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

async function getOrCreateDefaultAccount(userId: string) {
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

export async function importCSV(formData: FormData) {
  const session = await getSession()
  const userId = session.user.id

  const file = formData.get('file') as File | null
  if (!file) return { error: 'No file provided' }

  // Validacija fajla
  const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'text/plain']
  if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
    return { error: 'Only CSV files are allowed' }
  }

  if (file.size > 5 * 1024 * 1024) {
    return { error: 'File too large (max 5MB)' }
  }

  const csvText = await file.text()

  // Parsiraj
  const result = detectAndParse(csvText, file.name)

  if (result.trades.length === 0) {
    return {
      error: result.errors.length > 0
        ? `Could not parse file: ${result.errors[0]}`
        : 'No valid trades found in file',
    }
  }

  const account = await getOrCreateDefaultAccount(userId)

  // Provjeri duplikate po externalId
  const existingExternalIds = new Set<string>()
  if (result.trades.some(t => t.externalId)) {
    const existing = await db.query.trades.findMany({
      where: eq(trades.userId, userId),
    })
    existing.forEach(t => {
      if (t.externalId) existingExternalIds.add(t.externalId)
    })
  }

  // Insertuj tradove u batch
  let imported = 0
  let duplicates = 0

  const toInsert = result.trades
    .filter(t => {
      if (t.externalId && existingExternalIds.has(t.externalId)) {
        duplicates++
        return false
      }
      return true
    })
    .map((t: ParsedTrade) => ({
      id: nanoid(),
      userId,
      accountId: account.id,
      symbol: t.symbol,
      direction: t.direction,
      status: t.status,
      session: null,
      entryPrice: t.entryPrice.toString(),
      exitPrice: t.exitPrice?.toString() ?? null,
      stopLoss: null,
      takeProfit: null,
      lotSize: t.lotSize.toString(),
      commission: t.commission.toString(),
      swap: t.swap.toString(),
      grossPnl: t.grossPnl?.toString() ?? null,
      netPnl: t.netPnl?.toString() ?? null,
      rMultiple: null,
      riskAmount: null,
      openedAt: t.openedAt,
      closedAt: t.closedAt ?? null,
      durationMinutes: t.closedAt
        ? Math.floor((t.closedAt.getTime() - t.openedAt.getTime()) / 60000)
        : null,
      mae: null,
      mfe: null,
      plannedEntry: null,
      slippage: null,
      setupId: null,
      emotionTag: null,
      checklistPassed: null,
      aiScore: null,
      notes: t.notes ?? null,
      externalId: t.externalId ?? null,
      importSource: 'csv',
      createdAt: new Date(),
      updatedAt: new Date(),
    }))

  // Batch insert po 100
  for (let i = 0; i < toInsert.length; i += 100) {
    const batch = toInsert.slice(i, i + 100)
    if (batch.length > 0) {
      await db.insert(trades).values(batch)
      imported += batch.length
    }
  }

  revalidatePath('/trades')
  revalidatePath('/dashboard')

  return {
    success: true,
    imported,
    duplicates,
    skipped: result.skipped,
    errors: result.errors.slice(0, 10), // max 10 grešaka u response
  }
}