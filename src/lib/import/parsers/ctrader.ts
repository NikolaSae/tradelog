//src/lib/import/parsers/ctrader.ts
import { sanitizeString, sanitizeSymbol, sanitizeNumber, sanitizeLots, sanitizeDate, sanitizeDirection } from '../sanitize'
import type { ParsedTrade, ParseResult } from '../types'

// Fleksibilno dohvatanje kolone — podržava sve UTC offset varijante
function getCol(row: Record<string, string>, prefix: string): string {
  if (row[prefix] !== undefined) return row[prefix]
  const key = Object.keys(row).find(k => k.trim().startsWith(prefix))
  return key ? (row[key] ?? '') : ''
}

export function parseCTrader(rows: Record<string, string>[], filename: string): ParseResult {
  const parsedTrades: ParsedTrade[] = []
  const errors: string[] = []
  let skipped = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    const rowNum = i + 2

    try {
      const externalId = sanitizeString(getCol(row, 'Deal ID') || row['DealID'] || '')
      if (!externalId) {
        errors.push(`Row ${rowNum}: Missing Deal ID, skipping`)
        skipped++
        continue
      }

      const symbol = sanitizeSymbol(row['Symbol'] ?? '')
      if (!symbol) {
        errors.push(`Row ${rowNum}: Missing symbol, skipping`)
        skipped++
        continue
      }

      const directionRaw = sanitizeString(row['Opening Direction'] ?? '')
      const direction = sanitizeDirection(directionRaw)
      if (!direction) {
        errors.push(`Row ${rowNum}: Invalid direction "${directionRaw}", skipping`)
        skipped++
        continue
      }

      // FIX: getCol podržava UTC+1, UTC+2, UTC+3 itd.
      const openedAt = sanitizeDate(getCol(row, 'Opening Time'))
      if (!openedAt) {
        errors.push(`Row ${rowNum}: Invalid open time, skipping`)
        skipped++
        continue
      }

      const closedAt = sanitizeDate(getCol(row, 'Closing Time'))

      const entryPrice = sanitizeNumber(row['Entry price'] ?? row['Entry Price'] ?? '')
      if (!entryPrice) {
        errors.push(`Row ${rowNum}: Missing entry price, skipping`)
        skipped++
        continue
      }

      const exitPrice = sanitizeNumber(row['Closing Price'] ?? '')

      const lotRaw = row['Closing Quantity'] ?? ''
      const lotSize = sanitizeLots(lotRaw.replace(/\s*lots?\s*/i, '').trim())
      if (!lotSize) {
        errors.push(`Row ${rowNum}: Invalid lot size "${lotRaw}", skipping`)
        skipped++
        continue
      }

      const swap = sanitizeNumber(row['Swap'] ?? '0') ?? 0
      const commission = sanitizeNumber(row['Commissions'] ?? row['Commission'] ?? '0') ?? 0
      const netPnl = sanitizeNumber(row['Net USD'] ?? '')
      const grossPnl = sanitizeNumber(row['Gross USD'] ?? '')
      const status = closedAt ? 'CLOSED' : 'OPEN'

      const durationSeconds = closedAt && openedAt
        ? Math.floor((closedAt.getTime() - openedAt.getTime()) / 1000)
        : undefined

      parsedTrades.push({
        externalId,
        symbol,
        direction,
        status: status as 'OPEN' | 'CLOSED',
        entryPrice,
        exitPrice: exitPrice ?? undefined,
        lotSize,
        swap,
        commission: Math.abs(commission),
        grossPnl: grossPnl ?? undefined,
        netPnl: netPnl ?? undefined,
        openedAt,
        closedAt: closedAt ?? undefined,
        durationSeconds,
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

export function isCTraderFormat(headers: string[]): boolean {
  const required = ['Deal ID', 'Opening Direction', 'Net USD', 'Balance USD']
  const normalized = headers.map(h => h.trim())
  return required.every(col => normalized.some(h => h.includes(col.split(' ')[0])))
}