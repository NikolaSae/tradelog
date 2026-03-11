//src/db/schema/calendar-events.ts

import { pgTable, text, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core'
import { users } from './users'

export const eventTypeEnum = pgEnum('calendar_event_type', [
  'NEWS',
  'EARNINGS',
  'FOMC',
  'CPI',
  'NFP',
  'OTHER',
])

export const eventSeverityEnum = pgEnum('calendar_event_severity', [
  'LOW',
  'MEDIUM',
  'HIGH',
])

export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  date: text('date').notNull(), // YYYY-MM-DD
  time: text('time'), // HH:MM format, nullable
  type: eventTypeEnum('type').notNull().default('NEWS'),
  severity: eventSeverityEnum('severity').notNull().default('MEDIUM'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})