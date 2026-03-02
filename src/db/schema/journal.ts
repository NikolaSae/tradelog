//src/db/schema/journal.ts


import { pgTable, text, timestamp, integer, boolean } from 'drizzle-orm/pg-core'
import { users } from './users'

export const dailyJournals = pgTable('daily_journals', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),

  // Datum kao timestamp — čuva tačno vrijeme, ali koristimo samo date dio za lookup
  date: timestamp('date').notNull(),

  // Mood 1-5
  mood: integer('mood'),
  moodScore: integer('mood_score'), // legacy kolona, ostavljamo

  // Notes
  preSessionNotes: text('pre_session_notes'),
  postSessionNotes: text('post_session_notes'),
  lessonsLearned: text('lessons_learned'),
  marketConditions: text('market_conditions'),
  planForTomorrow: text('plan_for_tomorrow'),
  marketOutlook: text('market_outlook'), // legacy

  // Checklist
  rulesFollowed: boolean('rules_followed'),

  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})