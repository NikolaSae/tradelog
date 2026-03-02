//src/lib/import/parsers/ctrader.ts

import Papa from 'papaparse'
import {
  sanitizeString, sanitizeSymbol, sanitizeNumber,
  sanitizeLots, sanitizeDate, sanitizeExternalId, sanitizeDirection,
} from '../sanitize'
import type { ImportResult, ParsedTrade } from '../types'

// Očekivane kolone (lowercase)
const REQUIRED_COLS = ['deal id', 'symbol', 'opening direction', 'opening time (utc+1)', 'closing time (utc+1)', 'entry price', 'closing price', 'closing quantity']

export function parseCtraderCSV(csvText: string): ImportResult {
  const errors: string[] = []
  let skipped = 0
  const trades: ParsedTrade[] = []

  // Ograniči veličinu fajla (max 5MB)
  if (csvText.length > 5 * 1024 * 1024) {
    return { trades: [], errors: ['File too large (max 5MB)'], skipped: 0 }
  }

  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.toLowerCase().trim(),
  })

  // Provjeri da li postoje potrebne kolone
  const headers = Object.keys(result.data[0] ?? {})
  const missingCols = REQUIRED_COLS.filter(col => !headers.includes(col))
  if (missingCols.length > 0) {
    return {
      trades: [],
      errors: [`Missing columns: ${missingCols.join(', ')}`],
      skipped: 0,
    }
  }

  // Ograniči broj redova (max 10,000 tradova odjednom)
  const rows = result.data.slice(0, 10000)
  if (result.data.length > 10000) {
    errors.push(`File has ${result.data.length} rows. Only first 10,000 will be imported.`)
  }

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as Record<string, unknown>
    const rowNum = i + 2 // +2 jer je row 1 header

    // Sanitizuj sve podatke
    const externalId = sanitizeExternalId(row['deal id'])
    const symbol = sanitizeSymbol(row['symbol'])
    const direction = sanitizeDirection(row['opening direction'])
    const openedAt = sanitizeDate(row['opening time (utc+1)'])
    const closedAt = sanitizeDate(row['closing time (utc+1)'])
    const entryPrice = sanitizeNumber(row['entry price'])
    const exitPrice = sanitizeNumber(row['closing price'])
    const lotSize = sanitizeLots(row['closing quantity'])
    const swap = sanitizeNumber(row['swap']) ?? 0
    const commission = sanitizeNumber(row['commissions']) ?? 0
    const grossPnl = sanitizeNumber(row['gross usd']) ?? 0
    const netPnl = sanitizeNumber(row['net usd']) ?? 0

    // Validacija — preskoci red ako nedostaje kritičan podatak
    const rowErrors: string[] = []
    if (!symbol) rowErrors.push('invalid symbol')
    if (!direction) rowErrors.push('invalid direction (expected Buy/Sell)')
    if (!openedAt) rowErrors.push('invalid opening time')
    if (!closedAt) rowErrors.push('invalid closing time')
    if (entryPrice === null || entryPrice <= 0) rowErrors.push('invalid entry price')
    if (exitPrice === null || exitPrice <= 0) rowErrors.push('invalid closing price')
    if (lotSize === null) rowErrors.push('invalid lot size')

    if (rowErrors.length > 0) {
      errors.push(`Row ${rowNum}: ${rowErrors.join(', ')}`)
      skipped++
      continue
    }

    trades.push({
      externalId: externalId || undefined,
      symbol: symbol!,
      direction: direction!,
      entryPrice: entryPrice!,
      exitPrice: exitPrice!,
      lotSize: lotSize!,
      swap,
      commission: Math.abs(commission), // cTrader šalje negativne komisije
      grossPnl,
      netPnl,
      openedAt: openedAt!,
      closedAt: closedAt!,
      status: 'CLOSED',
    })
  }

  return { trades, errors, skipped }
}