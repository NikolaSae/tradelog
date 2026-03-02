//src/lib/import/types.ts
export interface ParsedTrade {
  symbol: string
  direction: 'LONG' | 'SHORT'
  entryPrice: number
  exitPrice: number
  lotSize: number
  commission: number
  swap: number
  grossPnl: number
  netPnl: number
  openedAt: Date
  closedAt: Date
  externalId?: string
  notes?: string
  status: 'CLOSED'
}

export interface ImportResult {
  trades: ParsedTrade[]
  errors: string[]
  skipped: number
}

export type BrokerFormat = 'CTRADER' | 'MT4' | 'MT5' | 'GENERIC'