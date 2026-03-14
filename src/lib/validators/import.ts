//src/lib/validators/import.ts

import { z } from 'zod'

export const ALLOWED_TARGET_COLUMNS = [
  'symbol', 'direction', 'entryPrice', 'exitPrice',
  'stopLoss', 'takeProfit', 'lotSize', 'commission',
  'swap', 'openedAt', 'closedAt', 'notes', 'emotionTag', 'session',
] as const

export type TargetColumn = typeof ALLOWED_TARGET_COLUMNS[number]

export const COLUMN_LABELS: Record<TargetColumn, string> = {
  symbol: 'Symbol *',
  direction: 'Direction *',
  entryPrice: 'Entry Price *',
  exitPrice: 'Exit Price',
  stopLoss: 'Stop Loss',
  takeProfit: 'Take Profit',
  lotSize: 'Lot Size *',
  commission: 'Commission',
  swap: 'Swap',
  openedAt: 'Opened At *',
  closedAt: 'Closed At',
  notes: 'Notes',
  emotionTag: 'Emotion',
  session: 'Session',
}

export const REQUIRED_COLUMNS: TargetColumn[] = [
  'symbol', 'direction', 'entryPrice', 'lotSize', 'openedAt',
]

export const columnMappingSchema = z.record(
  z.string().max(100),
  z.enum(ALLOWED_TARGET_COLUMNS).or(z.literal('__skip__'))
).refine(mapping => {
  const mappedTargets = Object.values(mapping).filter(v => v !== '__skip__')
  return REQUIRED_COLUMNS.every(req => mappedTargets.includes(req))
}, {
  message: `Required columns must be mapped: ${REQUIRED_COLUMNS.join(', ')}`,
})

export type ColumnMapping = z.infer<typeof columnMappingSchema>