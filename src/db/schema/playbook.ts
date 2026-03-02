//src/db/schema/playbook.ts


import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import { users } from './users'

export const playbookSetups = pgTable('playbook_setups', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  timeframe: text('timeframe'),
  markets: text('markets'),
  entryRules: text('entry_rules'),
  exitRules: text('exit_rules'),
  riskRules: text('risk_rules'),
  rules: text('rules'),       // legacy
  imageUrl: text('image_url'),
  isPublic: boolean('is_public').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})