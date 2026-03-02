//src/lib/validators/trade.ts


import { z } from 'zod'

export const tradeFormSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required').toUpperCase(),
  direction: z.enum(['LONG', 'SHORT']),
  status: z.enum(['OPEN', 'CLOSED', 'BREAKEVEN', 'PARTIALLY_CLOSED']).default('CLOSED'),
  session: z.enum(['ASIAN', 'LONDON', 'NEW_YORK', 'PACIFIC', 'OVERLAP_LONDON_NY']).optional(),

  entryPrice: z.coerce.number().positive('Entry price must be positive'),
  exitPrice: z.coerce.number().positive().optional(),
  stopLoss: z.coerce.number().positive().optional(),
  takeProfit: z.coerce.number().positive().optional(),
  lotSize: z.coerce.number().positive('Lot size must be positive'),

  commission: z.coerce.number().min(0).default(0),
  swap: z.coerce.number().default(0),

  openedAt: z.string().min(1, 'Open date is required'),
  closedAt: z.string().optional(),

  emotionTag: z.enum([
    'CONFIDENT', 'FEARFUL', 'GREEDY', 'NEUTRAL', 'REVENGE', 'FOMO', 'PATIENT'
  ]).optional(),

  notes: z.string().max(2000).optional(),
  setupId: z.string().optional(),
})

export type TradeFormValues = z.infer<typeof tradeFormSchema>