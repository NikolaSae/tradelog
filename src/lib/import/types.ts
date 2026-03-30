//src/lib/import/types.ts
export interface ParsedTrade {
  symbol: string
  direction: 'LONG' | 'SHORT'
  status: 'OPEN' | 'CLOSED'
  entryPrice: number
  exitPrice?: number
  stopLoss?: number
  takeProfit?: number
  lotSize: number
  commission: number
  swap: number
  grossPnl?: number
  netPnl?: number
  openedAt: Date
  closedAt?: Date
  externalId?: string | null
  notes?: string
  emotionTag?: string
  session?: string
  durationSeconds?: number
}

export interface ParseResult {
  trades: ParsedTrade[]
  errors: string[]
  skipped: number
  format?: string
}

export interface ImportResult {
  trades: ParsedTrade[]
  errors: string[]
  skipped: number
}

export type BrokerFormat = 'CTRADER' | 'MT4' | 'MT5' | 'GENERIC'