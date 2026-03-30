//src/actions/import.ts
'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { trades, brokerAccounts } from '@/db/schema'
import { eq, and, sql, inArray } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { PLANS } from '@/config/plans'
import { columnMappingSchema } from '@/lib/validators/import'
import { parseCustomCSV } from '@/lib/import/parsers/parser'
import { parseCTrader, isCTraderFormat } from '@/lib/import/parsers/ctrader'
import { importLimiter } from '@/lib/rate-limit'
import Papa from 'papaparse'

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

const MAX_FILE_SIZE = 5 * 1024 * 1024

function safeJSONParse(str: string): unknown {
  try {
    const parsed = JSON.parse(str)
    if (typeof parsed === 'object' && parsed !== null) {
      const dangerous = ['__proto__', 'constructor', 'prototype']
      const checkObj = (obj: unknown, depth = 0): boolean => {
        if (depth > 10) return false
        if (typeof obj !== 'object' || obj === null) return true
        for (const key of Object.keys(obj as object)) {
          if (dangerous.includes(key)) return false
          if (!checkObj((obj as Record<string, unknown>)[key], depth + 1)) return false
        }
        return true
      }
      if (!checkObj(parsed)) return null
    }
    return parsed
  } catch {
    return null
  }
}

async function getOrCreateDefaultAccount(userId: string) {
  const existing = await db.query.brokerAccounts.findFirst({
    where: and(
      eq(brokerAccounts.userId, userId),
      eq(brokerAccounts.isDefault, true)
    ),
  })
  if (existing) return existing

  const newAccount = {
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
  await db.insert(brokerAccounts).values(newAccount)
  return newAccount
}

export async function parseCSVHeaders(formData: FormData) {
  await getSession()

  const file = formData.get('file')
  if (!(file instanceof File)) return { error: 'No file provided' }
  if (file.size > MAX_FILE_SIZE) return { error: 'File too large (max 5MB)' }
  if (!file.name.toLowerCase().endsWith('.csv')) return { error: 'Only CSV files are supported' }

  const text = await file.text()
  if (!text.trim()) return { error: 'File is empty' }

  const result = Papa.parse(text, {
    header: true,
    preview: 5,
    skipEmptyLines: true,
  })

  if (result.errors.length > 0 && result.data.length === 0) {
    return { error: 'Failed to parse CSV file' }
  }

  const rawHeaders = result.meta.fields ?? []
  if (rawHeaders.length === 0) return { error: 'No columns found in CSV' }
  if (rawHeaders.length > 100) return { error: 'Too many columns (max 100)' }

  const safeHeaders = rawHeaders
    .map(h => String(h).trim().slice(0, 100))
    .filter(Boolean)

  const preview = (result.data as Record<string, string>[]).slice(0, 3).map(row => {
    const safeRow: Record<string, string> = {}
    for (const key of safeHeaders) {
      safeRow[key] = String(row[key] ?? '').slice(0, 100)
    }
    return safeRow
  })

  const isCTrader = isCTraderFormat(safeHeaders)

  return { headers: safeHeaders, preview, isCTrader }
}

export async function importCSVWithMapping(formData: FormData) {
  console.log('[import] START')
  const session = await getSession()
  console.log('[import] session ok, userId:', session.user.id)
  const userId = session.user.id
  const userPlan = ((session.user as any).plan ?? 'FREE') as keyof typeof PLANS

  // Rate limiting
  try {
    await importLimiter.check(session.user.id)
    console.log('[import] rate limit ok')
  } catch {
    console.log('[import] rate limit FAILED:', e)
    return { error: 'Too many import requests. Please wait a minute.' }
  }

  const file = formData.get('file')
  const mappingRaw = formData.get('mapping')
  const isCTraderFlag = formData.get('isCTrader') === 'true'
    console.log('[import] file:', file instanceof File ? `${file.name} (${file.size}b)` : 'NULL')
  console.log('[import] mappingRaw length:', typeof mappingRaw === 'string' ? mappingRaw.length : 'NULL')
  console.log('[import] isCTraderFlag:', isCTraderFlag)

  if (!(file instanceof File)) return { error: 'No file provided' }
  if (!mappingRaw || typeof mappingRaw !== 'string') return { error: 'No column mapping provided' }
  if (mappingRaw.length > 50_000) return { error: 'Mapping too large' }
  if (file.size > MAX_FILE_SIZE) return { error: 'File too large (max 5MB)' }
  if (!file.name.toLowerCase().endsWith('.csv')) return { error: 'Only CSV files are supported' }

  const mappingObj = safeJSONParse(mappingRaw)
console.log('[import] mappingObj:', mappingObj)
  if (!mappingObj) return { error: 'Invalid mapping format' }

  const text = await file.text()
console.log('[import] text length:', text.length)
  if (!text.trim()) return { error: 'File is empty' }

  // Parsuj CSV
  const csvResult = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: h => String(h).trim().slice(0, 100),
  })
console.log('[import] csvResult rows:', csvResult.data.length)
  console.log('[import] csvResult errors:', csvResult.errors.length)
  console.log('[import] csvHeaders:', csvResult.meta.fields?.slice(0, 5))
  if (csvResult.errors.length > 0 && csvResult.data.length === 0) {
    return { error: 'Failed to parse CSV file' }
  }

  const rows = csvResult.data as Record<string, string>[]
  const csvHeaders = csvResult.meta.fields ?? []
console.log('[import] isCTraderFormat check:', isCTraderFormat(csvHeaders))
  let parsedTrades: ReturnType<typeof parseCTrader>['trades'] = []
  let parseErrors: string[] = []
  let skipped = 0

  // cTrader — auto-detect ili explicit flag
  if (isCTraderFlag || isCTraderFormat(csvHeaders)) {
    console.log('[import] using cTrader parser')
    const result = parseCTrader(rows, file.name)
    parsedTrades = result.trades
    parseErrors = result.errors
    skipped = result.skipped
    console.log('[import] cTrader parsed:', parsedTrades.length, 'trades,', parseErrors.length, 'errors,', skipped, 'skipped')
    if (parseErrors.length > 0) console.log('[import] first 3 errors:', parseErrors.slice(0, 3))
  } else {
    // Custom CSV — validiraj mapping
    const mappingParsed = columnMappingSchema.safeParse(mappingObj)
    if (!mappingParsed.success) {
      return { error: mappingParsed.error.issues[0]?.message ?? 'Invalid column mapping' }
    }
    const result = parseCustomCSV(rows, mappingParsed.data, file.name)
    parsedTrades = result.trades
    parseErrors = result.errors
    skipped = result.skipped
  }

  if (parsedTrades.length === 0) {
    return { error: 'No valid trades found in file', errors: parseErrors }
  }

  // Free plan limit check
  if (userPlan === 'FREE') {
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(trades)
      .where(eq(trades.userId, userId))

    const current = Number(countResult[0]?.count ?? 0)
    const remaining = PLANS.FREE.maxTrades - current

    if (remaining <= 0) {
      return { error: `Free plan limit reached (${PLANS.FREE.maxTrades} trades). Upgrade to Pro.` }
    }

    if (parsedTrades.length > remaining) {
      parsedTrades = parsedTrades.slice(0, remaining)
      parseErrors.push(`Only ${remaining} trades imported due to Free plan limit.`)
    }
  }

  const account = await getOrCreateDefaultAccount(userId)

  // Dohvati postojeće externalId-ove jednim upitom
  const externalIds = parsedTrades
    .map(t => t.externalId)
    .filter((id): id is string => !!id)

  const existingExternalIds = new Set<string>()
  if (externalIds.length > 0) {
    const existing = await db.query.trades.findMany({
      where: and(
        eq(trades.userId, userId),
        inArray(trades.externalId, externalIds)
      ),
      columns: { externalId: true },
    })
    for (const e of existing) {
      if (e.externalId) existingExternalIds.add(e.externalId)
    }
  }

  let imported = 0
  let duplicates = 0
  const BATCH_SIZE = 100
  const toInsert: object[] = []

  for (const t of parsedTrades) {
    if (t.externalId && existingExternalIds.has(t.externalId)) {
      duplicates++
      continue
    }

    toInsert.push({
      id: nanoid(),
      userId,
      accountId: account.id,
      symbol: t.symbol,
      direction: t.direction as any,
      status: t.status as any,
      entryPrice: String(t.entryPrice),
      exitPrice: t.exitPrice ? String(t.exitPrice) : null,
      stopLoss: t.stopLoss ? String(t.stopLoss) : null,
      takeProfit: t.takeProfit ? String(t.takeProfit) : null,
      lotSize: String(t.lotSize),
      commission: String(t.commission ?? 0),
      swap: String(t.swap ?? 0),
      grossPnl: t.grossPnl ? String(t.grossPnl) : null,
      netPnl: t.netPnl ? String(t.netPnl) : null,
      rMultiple: null,
      riskAmount: null,
      openedAt: t.openedAt,
      closedAt: t.closedAt ?? null,
      durationSeconds: t.durationSeconds !== undefined
        ? t.durationSeconds
        : t.closedAt
          ? Math.floor((t.closedAt.getTime() - t.openedAt.getTime()) / 1000)
          : null,
      durationMinutes: t.closedAt
        ? Math.floor((t.closedAt.getTime() - t.openedAt.getTime()) / 60000)
        : null,
      mae: null,
      mfe: null,
      plannedEntry: null,
      slippage: null,
      setupId: null,
      emotionTag: (t.emotionTag as any) ?? null,
      session: (t.session as any) ?? null,
      checklistPassed: null,
      aiScore: null,
      notes: t.notes ?? null,
      externalId: t.externalId ?? null,
      importSource: isCTraderFlag || isCTraderFormat(csvHeaders) ? 'ctrader' : 'custom_csv',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  // Batch insert
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE)
    await db.insert(trades).values(batch as any)
    imported += batch.length
  }

  revalidatePath('/trades')
  revalidatePath('/dashboard')

  return {
    success: true,
    imported,
    duplicates,
    skipped,
    errors: parseErrors.slice(0, 50),
  }
}