//src/db/schema/audit.ts


import { pgTable, text, timestamp, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { users } from './users'

export const auditLogs = pgTable('audit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id'),
  metadata: json('metadata'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})
export const processedWebhookEvents = pgTable('processed_webhook_events', {
  id: text('id').primaryKey(),          // = stripe event.id
  type: text('type').notNull(),          // event.type
  processedAt: timestamp('processed_at').notNull().defaultNow(),
}, (t) => [
  uniqueIndex('processed_webhook_events_id_idx').on(t.id),
])