//src/db/schema/subscriptions.ts

import { pgTable, text, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING', 'INCOMPLETE', 'PAUSED'
])

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  stripeSubscriptionId: text('stripe_subscription_id').notNull().unique(),
  stripePriceId: text('stripe_price_id').notNull(),
  status: subscriptionStatusEnum('status').notNull(),
  currentPeriodStart: timestamp('current_period_start').notNull(),
  currentPeriodEnd: timestamp('current_period_end').notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  trialEnd: timestamp('trial_end'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const billingHistory = pgTable('billing_history', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  stripeInvoiceId: text('stripe_invoice_id').notNull().unique(),
  amount: integer('amount').notNull(), // u centima
  currency: text('currency').notNull().default('usd'),
  status: text('status').notNull(),
  paidAt: timestamp('paid_at'),
  invoiceUrl: text('invoice_url'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})