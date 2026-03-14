//src/lib/import/parsers/parser.ts
import { sanitizeString, sanitizeSymbol, sanitizeNumber, sanitizeLots, sanitizeDate, sanitizeDirection } from '../sanitize'
import type { ParsedTrade } from './types'
import type { ColumnMapping } from '@/lib/validators/import'
import { ALLOWED_TARGET_COLUMNS } from '@/lib/validators/import'

const MAX_ROWS = 10000
const MAX_CELL_LENGTH = 500

// Sanitizuj vrijednost ćelije — spriječi injection
function sanitizeCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value).trim()
  // Ograniči dužinu i ukloni null bytes
  return str.slice(0, MAX_CELL_LENGTH).replace(/\0/g, '')
}

export function parseCustomCSV(
  rows: Record<string, string>[],
  mapping: ColumnMapping,
  filename: string
): { trades: ParsedTrade[]; errors: string[]; skipped: number } {
  const errors: string[] = []
  const trades: ParsedTrade[] = []
  let skipped = 0

  // Validiraj mapping — samo dozvoljene target kolone
  for (const [source, target] of Object.entries(mapping)) {
    if (target === '__skip__') continue
    if (!ALLOWED_TARGET_COLUMNS.includes(target as any)) {
      errors.push(`Invalid target column: ${target}`)
      return { trades: [], errors, skipped: 0 }
    }
    if (source.length > 100) {
      errors.push(`Source column name too long: ${source.slice(0, 50)}...`)
      return { trades: [], errors, skipped: 0 }
    }
  }

  // Inverzni mapping: target → source
  const inverseMap = new Map<string, string>()
  for (const [source, target] of Object.entries(mapping)) {
    if (target !== '__skip__') {
      inverseMap.set(target, source)
    }
  }

  // Ograniči broj redova
  const limitedRows = rows.slice(0, MAX_ROWS)
  if (rows.length > MAX_ROWS) {
    errors.push(`File has ${rows.length} rows. Only first ${MAX_ROWS} will be imported.`)
  }

  for (let i = 0; i < limitedRows.length; i++) {
    const row = limitedRows[i]
    const rowNum = i + 2

    try {
      // Dohvati vrijednosti prema mappingu
      const get = (target: string): string => {
        const source = inverseMap.get(target)
        if (!source) return ''
        return sanitizeCell(row[source] ?? '')
      }

      // Symbol
      const symbol = sanitizeSymbol(get('symbol'))
      if (!symbol) {
        errors.push(`Row ${rowNum}: Missing or invalid symbol, skipping`)
        skipped++
        continue
      }

      // Direction
      const direction = sanitizeDirection(get('direction'))
      if (!direction) {
        errors.push(`Row ${rowNum}: Invalid direction "${get('direction')}", skipping`)
        skipped++
        continue
      }

      // Entry price
      const entryPrice = sanitizeNumber(get('entryPrice'))
      if (!entryPrice || entryPrice <= 0) {
        errors.push(`Row ${rowNum}: Invalid entry price, skipping`)
        skipped++
        continue
      }

      // Lot size
      const lotSize = sanitizeLots(get('lotSize').replace(/\s*lots?\s*/i, '').trim())
      if (!lotSize || lotSize <= 0) {
        errors.push(`Row ${rowNum}: Invalid lot size, skipping`)
        skipped++
        continue
      }

      // Opened at
      const openedAt = sanitizeDate(get('openedAt'))
      if (!openedAt) {
        errors.push(`Row ${rowNum}: Invalid opened at date, skipping`)
        skipped++
        continue
      }

      // Optional fields
      const exitPrice = sanitizeNumber(get('exitPrice')) ?? undefined
      const stopLoss = sanitizeNumber(get('stopLoss')) ?? undefined
      const takeProfit = sanitizeNumber(get('takeProfit')) ?? undefined
      const commission = sanitizeNumber(get('commission')) ?? 0
      const swap = sanitizeNumber(get('swap')) ?? 0
      const closedAt = sanitizeDate(get('closedAt')) ?? undefined

      // Notes — dodatna sanitizacija
      const rawNotes = get('notes')
      const notes = rawNotes ? rawNotes.slice(0, 2000) : undefined

      // EmotionTag — whitelist
      const VALID_EMOTIONS = ['CONFIDENT', 'FEARFUL', 'GREEDY', 'NEUTRAL', 'REVENGE', 'FOMO', 'PATIENT']
      const rawEmotion = get('emotionTag').toUpperCase()
      const emotionTag = VALID_EMOTIONS.includes(rawEmotion) ? rawEmotion : undefined

      // Session — whitelist
      const VALID_SESSIONS = ['ASIAN', 'LONDON', 'NEW_YORK', 'PACIFIC', 'OVERLAP_LONDON_NY']
      const rawSession = get('session').toUpperCase()
      const session = VALID_SESSIONS.includes(rawSession) ? rawSession : undefined

      trades.push({
        symbol,
        direction,
        status: closedAt ? 'CLOSED' : 'OPEN',
        entryPrice,
        exitPrice,
        stopLoss,
        takeProfit,
        lotSize,
        commission: Math.abs(commission),
        swap,
        openedAt,
        closedAt,
        notes,
        emotionTag,
        session,
        externalId: null,
        grossPnl: undefined,
        netPnl: undefined,
      })
    } catch (err) {
      errors.push(`Row ${rowNum}: Unexpected error — ${err}`)
      skipped++
    }
  }

  return { trades, errors, skipped }
}