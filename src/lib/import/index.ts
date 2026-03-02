//src/lib/import/index.ts

import { parseCtraderCSV } from './parsers/ctrader'
import { parseGenericCSV } from './parsers/generic'
import type { ImportResult } from './types'

export function detectAndParse(csvText: string, filename: string): ImportResult {
  const lower = filename.toLowerCase()

  // Pokušaj cTrader format (Deal ID kolona je karakteristična)
  if (csvText.includes('Deal ID') || csvText.includes('Opening Direction')) {
    return parseCtraderCSV(csvText)
  }

  // Fallback na generic
  return parseGenericCSV(csvText)
}

export * from './types'