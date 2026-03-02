//src/lib/import/parsers/generic.ts

import Papa from 'papaparse'
import {
  sanitizeSymbol, sanitizeNumber, sanitizeLots,
  sanitizeDate, sanitizeExternalId, sanitizeDirection,
} from '../sanitize'
import type { ImportResult, ParsedTrade } from '../types'

export function parseGenericCSV(csvText: string): ImportResult {
  const errors: string[] = []
  let skipped = 0
  const trades: ParsedTrade[] = []

  if (csvText.length > 5 * 1024 * 1024) {
    return { trades: [], errors: ['File too large (max 5MB)'], skipped: 0 }
  }

  const result = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.toLowerCase().trim().replace(/\s+/g, '_'),
  })

  const rows = result.data.slice(0, 10000) as Record<string, unknown>[]

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    const symbol = sanitizeSymbol(row['symbol'])
    const direction = sanitizeDirection(row['direction'])
    const openedAt = sanitizeDate(row['opened_at'] ?? row['open_time'] ?? row['open_date'])
    const closedAt = sanitizeDate(row['closed_at'] ?? row['close_time'] ?? row['close_date'])
    const entryPrice = sanitizeNumber(row['entry_price'] ?? row['entry'])
    const exitPrice = sanitizeNumber(row['exit_price'] ?? row['exit'] ?? row['close_price'])
    const lotSize = sanitizeLots(row['lot_size'] ?? row['lots'] ?? row['volume'] ?? row['quantity'])
    const swap = sanitizeNumber(row['swap']) ?? 0
    const commission = sanitizeNumber(row['commission']) ?? 0
    const netPnl = sanitizeNumber(row['net_pnl'] ?? row['profit'] ?? row['pnl']) ?? 0
    const grossPnl = sanitizeNumber(row['gross_pnl']) ?? netPnl

    const rowErrors: string[] = []
    if (!symbol) rowErrors.push('invalid symbol')
    if (!direction) rowErrors.push('invalid direction')
    if (!openedAt) rowErrors.push('invalid open date')
    if (entryPrice === null || entryPrice <= 0) rowErrors.push('invalid entry price')
    if (lotSize === null) rowErrors.push('invalid lot size')

    if (rowErrors.length > 0) {
      errors.push(`Row ${rowNum}: ${rowErrors.join(', ')}`)
      skipped++
      continue
    }

    trades.push({
      symbol: symbol!,
      direction: direction!,
      entryPrice: entryPrice!,
      exitPrice: exitPrice ?? entryPrice!,
      lotSize: lotSize!,
      swap,
      commission: Math.abs(commission),
      grossPnl,
      netPnl,
      openedAt: openedAt!,
      closedAt: closedAt ?? openedAt!,
      status: closedAt ? 'CLOSED' : 'CLOSED',
    })
  }

  return { trades, errors, skipped }
}