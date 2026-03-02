//src/types/trade.ts


export type Direction = 'LONG' | 'SHORT'
export type TradeStatus = 'OPEN' | 'CLOSED' | 'BREAKEVEN' | 'PARTIALLY_CLOSED'
export type TradingSession = 'ASIAN' | 'LONDON' | 'NEW_YORK' | 'PACIFIC' | 'OVERLAP_LONDON_NY'
export type EmotionTag = 'CONFIDENT' | 'FEARFUL' | 'GREEDY' | 'NEUTRAL' | 'REVENGE' | 'FOMO' | 'PATIENT'

export interface Trade {
  id: string
  userId: string
  accountId: string
  symbol: string
  direction: Direction
  status: TradeStatus
  session: TradingSession | null
  entryPrice: string
  exitPrice: string | null
  stopLoss: string | null
  takeProfit: string | null
  lotSize: string
  commission: string | null
  swap: string | null
  grossPnl: string | null
  netPnl: string | null
  rMultiple: string | null
  riskAmount: string | null
  openedAt: Date
  closedAt: Date | null
  durationMinutes: number | null
  mae: string | null
  mfe: string | null
  plannedEntry: string | null
  slippage: string | null
  setupId: string | null
  emotionTag: EmotionTag | null
  checklistPassed: boolean | null
  aiScore: number | null
  notes: string | null
  externalId: string | null
  importSource: string | null
  createdAt: Date
  updatedAt: Date
}

export type TimePeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all'