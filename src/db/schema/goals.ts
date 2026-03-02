//src/db/schema/goals.ts

import { pgTable, text, timestamp, numeric, boolean, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

export const goalTypeEnum = pgEnum('goal_type', [
  'NET_PNL',
  'WIN_RATE',
  'MAX_DRAWDOWN',
  'MAX_DAILY_LOSS',
  'MAX_TRADES_PER_DAY',
  'MIN_RRR',
  'PROFIT_FACTOR',
  'TRADES',
])

export const goalPeriodEnum = pgEnum('goal_period', [
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'YEARLY',
])

export const alertTypeEnum = pgEnum('alert_type', [
  'DAILY_LOSS_LIMIT',
  'DRAWDOWN_LIMIT',
  'LOSING_STREAK',
  'OVERTRADING',
  'GOAL_ACHIEVED',
])

export const goals = pgTable('goals', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull().default(''),
  type: goalTypeEnum('type').notNull(),
  period: goalPeriodEnum('period').notNull(),
  targetValue: numeric('target_value', { precision: 18, scale: 4 }).notNull(),
  currentValue: numeric('current_value', { precision: 18, scale: 4 }).default('0'),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const alerts = pgTable('alerts', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: alertTypeEnum('type').notNull(),
  threshold: numeric('threshold', { precision: 18, scale: 4 }).notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastFired: timestamp('last_fired'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})