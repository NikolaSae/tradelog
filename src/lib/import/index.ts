// src/lib/import/index.ts

import Papa from 'papaparse'
import { parseCTrader, isCTraderFormat } from './parsers/ctrader'
import { parseGenericCSV } from './parsers/generic'
import type { ImportResult } from './types'

export function detectAndParse(csvText: string, filename: string): ImportResult {
  // Parsiraj CSV u redove
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    trimHeaders: true,
  })

  const headers = parsed.meta.fields ?? []
  const rows = parsed.data

  // Detekcija cTrader formata
  if (isCTraderFormat(headers)) {
    return parseCTrader(rows, filename)
  }

  // Fallback na generic
  return parseGenericCSV(csvText)
}

export * from './types'