//src/lib/import/parsers/ctrader.ts
// src/lib/import/parsers/ctrader.ts

import { sanitizeString, sanitizeSymbol, sanitizeNumber, sanitizeLots, sanitizeDate, sanitizeDirection } from '../sanitize'
import type { ParsedTrade, ParseResult } from '../types'

export function parseCTrader(rows: Record<string, string>[], filename: string): ParseResult {
  const parsedTrades: ParsedTrade[] = []
  const errors: string[] = []
  let skipped = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2 // +2 jer je red 1 header

    try {
      // External ID
      const externalId = sanitizeString(row['Deal ID'] ?? row['DealID'] ?? '')
      if (!externalId) {
        errors.push(`Row ${rowNum}: Missing Deal ID, skipping`)
        skipped++
        continue
      }

      // Symbol
      const symbol = sanitizeSymbol(row['Symbol'] ?? '')
      if (!symbol) {
        errors.push(`Row ${rowNum}: Missing symbol, skipping`)
        skipped++
        continue
      }

      // Direction — "Buy" → LONG, "Sell" → SHORT
      const directionRaw = sanitizeString(row['Opening Direction'] ?? '')
      const direction = sanitizeDirection(directionRaw)
      if (!direction) {
        errors.push(`Row ${rowNum}: Invalid direction "${directionRaw}", skipping`)
        skipped++
        continue
      }

      // Dates
      const openedAt = sanitizeDate(row['Opening Time (UTC+1)'] ?? row['Opening Time'] ?? '')
      if (!openedAt) {
        errors.push(`Row ${rowNum}: Invalid open time, skipping`)
        skipped++
        continue
      }

      const closedAt = sanitizeDate(row['Closing Time (UTC+1)'] ?? row['Closing Time'] ?? '')

      // Prices
      const entryPrice = sanitizeNumber(row['Entry price'] ?? row['Entry Price'] ?? '')
      if (!entryPrice) {
        errors.push(`Row ${rowNum}: Missing entry price, skipping`)
        skipped++
        continue
      }

      const exitPrice = sanitizeNumber(row['Closing Price'] ?? '')

      // Lot size — "0.08 Lots" → 0.08
      const lotRaw = row['Closing Quantity'] ?? ''
      const lotSize = sanitizeLots(lotRaw.replace(/\s*lots?\s*/i, '').trim())
      if (!lotSize) {
        errors.push(`Row ${rowNum}: Invalid lot size "${lotRaw}", skipping`)
        skipped++
        continue
      }

      // Financials
      const swap = sanitizeNumber(row['Swap'] ?? '0') ?? 0
      const commission = sanitizeNumber(row['Commissions'] ?? row['Commission'] ?? '0') ?? 0

      // ✅ Net USD = profit po poziciji (već uključuje swap i komisiju)
      const netPnl = sanitizeNumber(row['Net USD'] ?? '')

      // Gross USD = bruto profit bez troškova
      const grossPnl = sanitizeNumber(row['Gross USD'] ?? '')

      // Balance nakon zatvaranja (informativan, ne koristimo za P&L)
      // const balanceAfter = sanitizeNumber(row['Balance USD'] ?? '')

      const status = closedAt ? 'CLOSED' : 'OPEN'

      parsedTrades.push({
        externalId,
        symbol,
        direction,
        status: status as 'OPEN' | 'CLOSED',
        entryPrice,
        exitPrice: exitPrice ?? undefined,
        lotSize,
        swap,
        commission: Math.abs(commission), // komisija je negativna u cTrader exportu
        grossPnl: grossPnl ?? undefined,
        netPnl: netPnl ?? undefined,      // ✅ koristimo Net USD
        openedAt,
        closedAt: closedAt ?? undefined,
        notes: `Channel: ${sanitizeString(row['Channel'] ?? '')}`,
      })
    } catch (err) {
      errors.push(`Row ${rowNum}: Unexpected error — ${err}`)
      skipped++
    }
  }

  return {
    trades: parsedTrades,
    errors,
    skipped,
    format: 'ctrader',
  }
}

// Detekcija cTrader formata — provjeri karakteristične kolone
export function isCTraderFormat(headers: string[]): boolean {
  const required = ['Deal ID', 'Opening Direction', 'Net USD', 'Balance USD']
  const normalized = headers.map(h => h.trim())
  return required.every(col => normalized.some(h => h.includes(col.split(' ')[0])))
}