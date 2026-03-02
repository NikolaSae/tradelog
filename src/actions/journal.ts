//src/actions/journal.ts

'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { eq, and, gte, lt, desc } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { dailyJournals } from '@/db/schema'
import { auth } from '@/lib/auth'

const journalSchema = z.object({
  date: z.string(), // format: YYYY-MM-DD
  mood: z.number().min(1).max(5).optional(),
  preSessionNotes: z.string().max(3000).optional(),
  postSessionNotes: z.string().max(3000).optional(),
  lessonsLearned: z.string().max(2000).optional(),
  rulesFollowed: z.boolean().optional(),
  marketConditions: z.string().max(500).optional(),
  planForTomorrow: z.string().max(1000).optional(),
})

export type JournalFormValues = z.infer<typeof journalSchema>

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

// Konvertuj YYYY-MM-DD string u timestamp za podne UTC
// Razlog: čuvamo kao timestamp, ali podne UTC garantuje da
// nema timezone pomaka (ne preskočiti dan zbog UTC offset-a)
function dateStringToTimestamp(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0, 0))
}

// Dobij početak i kraj dana za range query
function getDayRange(dateStr: string): { from: Date; to: Date } {
  const [year, month, day] = dateStr.split('-').map(Number)
  const from = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0))
  const to = new Date(Date.UTC(year, month - 1, day + 1, 0, 0, 0, 0))
  return { from, to }
}

export async function upsertJournal(values: JournalFormValues) {
  const session = await getSession()
  const userId = session.user.id

  const parsed = journalSchema.safeParse(values)
  if (!parsed.success) return { error: 'Invalid data' }

  const { from, to } = getDayRange(parsed.data.date)
  const dateTimestamp = dateStringToTimestamp(parsed.data.date)

  const existing = await db.query.dailyJournals.findFirst({
    where: and(
      eq(dailyJournals.userId, userId),
      gte(dailyJournals.date, from),
      lt(dailyJournals.date, to)
    ),
  })

  if (existing) {
    await db.update(dailyJournals)
      .set({
        mood: parsed.data.mood ?? null,
        preSessionNotes: parsed.data.preSessionNotes ?? null,
        postSessionNotes: parsed.data.postSessionNotes ?? null,
        lessonsLearned: parsed.data.lessonsLearned ?? null,
        rulesFollowed: parsed.data.rulesFollowed ?? null,
        marketConditions: parsed.data.marketConditions ?? null,
        planForTomorrow: parsed.data.planForTomorrow ?? null,
        updatedAt: new Date(),
      })
      .where(eq(dailyJournals.id, existing.id))
  } else {
    await db.insert(dailyJournals).values({
      id: nanoid(),
      userId,
      date: dateTimestamp,
      mood: parsed.data.mood ?? null,
      preSessionNotes: parsed.data.preSessionNotes ?? null,
      postSessionNotes: parsed.data.postSessionNotes ?? null,
      lessonsLearned: parsed.data.lessonsLearned ?? null,
      rulesFollowed: parsed.data.rulesFollowed ?? null,
      marketConditions: parsed.data.marketConditions ?? null,
      planForTomorrow: parsed.data.planForTomorrow ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  revalidatePath('/journal')
  revalidatePath(`/journal/${parsed.data.date}`)
  return { success: true }
}

export async function getJournals(limit = 60) {
  const session = await getSession()
  const entries = await db.query.dailyJournals.findMany({
    where: eq(dailyJournals.userId, session.user.id),
    orderBy: [desc(dailyJournals.date)],
    limit,
  })

  // Dodaj dateString helper za svaki entry
  return entries.map(e => ({
    ...e,
    dateString: e.date.toISOString().split('T')[0],
  }))
}

export async function getJournalByDate(dateStr: string) {
  const session = await getSession()
  const { from, to } = getDayRange(dateStr)

  const entry = await db.query.dailyJournals.findFirst({
    where: and(
      eq(dailyJournals.userId, session.user.id),
      gte(dailyJournals.date, from),
      lt(dailyJournals.date, to)
    ),
  })

  if (!entry) return null
  return {
    ...entry,
    dateString: entry.date.toISOString().split('T')[0],
  }
}

export async function deleteJournal(id: string) {
  const session = await getSession()
  await db.delete(dailyJournals).where(
    and(
      eq(dailyJournals.id, id),
      eq(dailyJournals.userId, session.user.id)
    )
  )
  revalidatePath('/journal')
  return { success: true }
}