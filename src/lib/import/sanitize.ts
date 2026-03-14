// src/lib/import/sanitize.ts

export function sanitizeString(val: unknown, maxLen = 100): string {
  if (val === null || val === undefined) return ''
  // Ukloni sve kontrolne karaktere i trim
  return String(val)
    .replace(/[\x00-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maxLen)
}

export function sanitizeSymbol(val: unknown): string {
  // Samo slova, cifre, tačka, donja crta — bez HTML/SQL
  return sanitizeString(val, 20).replace(/[^A-Za-z0-9._]/g, '').toUpperCase()
}

export function sanitizeNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  // Ukloni sve osim cifara, tačke, minusa
  const cleaned = String(val).replace(/[^0-9.\-]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

export function sanitizeLots(val: unknown): number | null {
  // "0.08 Lots" → 0.08
  const str = String(val ?? '').replace(/[^0-9.]/g, '')
  const num = parseFloat(str)
  return isNaN(num) || num <= 0 || num > 10000 ? null : num
}

export function sanitizeDate(val: unknown): Date | null {
  if (!val) return null
  const str = sanitizeString(val, 50)
  // Format: "02 Feb 2026 14:23:21.022"
  const d = new Date(str)
  if (isNaN(d.getTime())) return null
  // Odbaci datume koji su previše u prošlosti ili budućnosti
  const year = d.getFullYear()
  if (year < 2000 || year > 2100) return null
  return d
}

export function sanitizeExternalId(val: unknown): string {
  // Samo alfanumerički + par specijalnih — sprječava injection
  return sanitizeString(val, 50).replace(/[^A-Za-z0-9_\-]/g, '')
}

export function sanitizeDirection(val: unknown): 'LONG' | 'SHORT' | null {
  const str = sanitizeString(val, 10).toLowerCase()
  if (str === 'buy' || str === 'long') return 'LONG'
  if (str === 'sell' || str === 'short') return 'SHORT'
  return null
}

export function sanitizeForCSVExport(value: string | null | undefined): string {
  if (!value) return ''
  const str = String(value).trim()
  // Prefiksiraj opasne karaktere sa apostrofom
  if (/^[=+\-@|]/.test(str)) {
    return `'${str}`
  }
  return str
}