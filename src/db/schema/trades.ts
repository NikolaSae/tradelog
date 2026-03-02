//src/db/schema/trades.ts


import { pgTable, text, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

export const directionEnum = pgEnum('direction', ['LONG', 'SHORT'])
export const tradeStatusEnum = pgEnum('trade_status', ['OPEN', 'CLOSED', 'BREAKEVEN', 'PARTIALLY_CLOSED'])
export const tradingSessionEnum = pgEnum('trading_session', ['ASIAN', 'LONDON', 'NEW_YORK', 'PACIFIC', 'OVERLAP_LONDON_NY'])
export const emotionTagEnum = pgEnum('emotion_tag', ['CONFIDENT', 'FEARFUL', 'GREEDY', 'NEUTRAL', 'REVENGE', 'FOMO', 'PATIENT'])
export const tagTypeEnum = pgEnum('tag_type', ['SETUP', 'EMOTION', 'SESSION', 'CUSTOM'])
export const importStatusEnum = pgEnum('import_status', ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'])

export const brokerAccounts = pgTable('broker_accounts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  broker: text('broker'),
  accountNumber: text('account_number'),
  currency: text('currency').notNull().default('USD'),
  initialBalance: numeric('initial_balance', { precision: 18, scale: 2 }).notNull(),
  currentBalance: numeric('current_balance', { precision: 18, scale: 2 }).notNull(),
  isDefault: boolean('is_default').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const trades = pgTable('trades', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull().references(() => brokerAccounts.id, { onDelete: 'cascade' }),
  symbol: text('symbol').notNull(),
  direction: directionEnum('direction').notNull(),
  status: tradeStatusEnum('status').notNull().default('CLOSED'),
  session: tradingSessionEnum('session'),

  // Prices
  entryPrice: numeric('entry_price', { precision: 18, scale: 8 }).notNull(),
  exitPrice: numeric('exit_price', { precision: 18, scale: 8 }),
  stopLoss: numeric('stop_loss', { precision: 18, scale: 8 }),
  takeProfit: numeric('take_profit', { precision: 18, scale: 8 }),
  lotSize: numeric('lot_size', { precision: 18, scale: 4 }).notNull(),

  // P&L
  commission: numeric('commission', { precision: 18, scale: 2 }).default('0'),
  swap: numeric('swap', { precision: 18, scale: 2 }).default('0'),
  grossPnl: numeric('gross_pnl', { precision: 18, scale: 2 }),
  netPnl: numeric('net_pnl', { precision: 18, scale: 2 }),
  rMultiple: numeric('r_multiple', { precision: 8, scale: 4 }),
  riskAmount: numeric('risk_amount', { precision: 18, scale: 2 }),

  // Timing
  openedAt: timestamp('opened_at').notNull(),
  closedAt: timestamp('closed_at'),
  durationMinutes: integer('duration_minutes'),

  // MAE/MFE
  mae: numeric('mae', { precision: 18, scale: 2 }),
  mfe: numeric('mfe', { precision: 18, scale: 2 }),

  // Execution
  plannedEntry: numeric('planned_entry', { precision: 18, scale: 8 }),
  slippage: numeric('slippage', { precision: 18, scale: 8 }),

  // Metadata
  setupId: text('setup_id'),
  emotionTag: emotionTagEnum('emotion_tag'),
  checklistPassed: boolean('checklist_passed'),
  aiScore: integer('ai_score'),
  notes: text('notes'),
  externalId: text('external_id'),
  importSource: text('import_source'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const tradeScreenshots = pgTable('trade_screenshots', {
  id: text('id').primaryKey(),
  tradeId: text('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  caption: text('caption'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const tags = pgTable('tags', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color'),
  type: tagTypeEnum('type').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const tradeTags = pgTable('trade_tags', {
  id: text('id').primaryKey(),
  tradeId: text('trade_id').notNull().references(() => trades.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
})

export const brokerImports = pgTable('broker_imports', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull().references(() => brokerAccounts.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  broker: text('broker'),
  status: importStatusEnum('status').notNull().default('PENDING'),
  tradesCount: integer('trades_count'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})