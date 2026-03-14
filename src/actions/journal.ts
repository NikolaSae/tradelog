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
import { toLocalDateStr, getDayRange, dateStringToTimestamp, DATE_REGEX } from '@/lib/utils'


const journalSchema = z.object({
  id: z.string().max(50).optional(), // postojeći ID za update
  date: z.string()
    .regex(DATE_REGEX, 'Invalid date format')
    .refine(s => {
      const [year, month, day] = s.split('-').map(Number)
      const d = new Date(Date.UTC(year, month - 1, day))
      return !isNaN(d.getTime())
    }, 'Invalid date')
    .refine(s => {
      const [year, month, day] = s.split('-').map(Number)
      const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))
      const today = new Date()
      const todayUtc = new Date(Date.UTC(
        today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(),
        23, 59, 59, 999
      ))
      return d <= todayUtc
    }, 'Cannot create journal entry for a future date'),
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




// src/actions/journal.ts

export async function upsertJournal(
  values: JournalFormValues,
  originalDate?: string
) {
  const session = await getSession()
  const userId = session.user.id

  const parsed = journalSchema.safeParse(values)
  if (!parsed.success) return { error: 'Invalid data' }

  const [y, mo, d] = parsed.data.date.split('-').map(Number)
  const inputDate = new Date(Date.UTC(y, mo - 1, d, 12, 0, 0, 0))
  const today = new Date()
  const todayUtc = new Date(Date.UTC(
    today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(),
    23, 59, 59, 999
  ))
  if (inputDate > todayUtc) return { error: 'Cannot create journal entry for a future date' }

  const newDate = parsed.data.date
  const dateTimestamp = dateStringToTimestamp(newDate)
  const isDateChanged = originalDate && originalDate !== newDate

  const payload = {
    date: dateTimestamp,
    mood: parsed.data.mood ?? null,
    preSessionNotes: parsed.data.preSessionNotes ?? null,
    postSessionNotes: parsed.data.postSessionNotes ?? null,
    lessonsLearned: parsed.data.lessonsLearned ?? null,
    rulesFollowed: parsed.data.rulesFollowed ?? null,
    marketConditions: parsed.data.marketConditions ?? null,
    planForTomorrow: parsed.data.planForTomorrow ?? null,
    updatedAt: new Date(),
  }

  if (parsed.data.id) {
    // UPDATE po ID — jedini siguran način identifikacije
    // Ownership check — user može mijenjati samo svoje entrie
    const existing = await db.query.dailyJournals.findFirst({
      where: and(
        eq(dailyJournals.id, parsed.data.id),
        eq(dailyJournals.userId, userId)
      ),
    })

    if (!existing) return { error: 'Entry not found' }

    // Ako se datum mijenja, provjeri da novi datum nema drugi entry
    if (isDateChanged) {
      const { from, to } = getDayRange(newDate)
      const conflicting = await db.query.dailyJournals.findFirst({
        where: and(
          eq(dailyJournals.userId, userId),
          gte(dailyJournals.date, from),
          lt(dailyJournals.date, to)
        ),
      })

      if (conflicting && conflicting.id !== parsed.data.id) {
        return { error: `An entry already exists for ${newDate}. Please choose a different date.` }
      }
    }

    await db.update(dailyJournals)
      .set(payload)
      .where(and(
        eq(dailyJournals.id, parsed.data.id),
        eq(dailyJournals.userId, userId)
      ))

  } else {
    // INSERT — novi entry, provjeri da datum nema existing entry
    const { from, to } = getDayRange(newDate)
    const existing = await db.query.dailyJournals.findFirst({
      where: and(
        eq(dailyJournals.userId, userId),
        gte(dailyJournals.date, from),
        lt(dailyJournals.date, to)
      ),
    })

    if (existing) {
      // Entry već postoji za taj datum — updateuj ga umjesto insert
      await db.update(dailyJournals)
        .set(payload)
        .where(and(
          eq(dailyJournals.id, existing.id),
          eq(dailyJournals.userId, userId)
        ))
    } else {
      await db.insert(dailyJournals).values({
        id: nanoid(),
        userId,
        ...payload,
        createdAt: new Date(),
      })
    }
  }

  revalidatePath('/journal')
  revalidatePath(`/journal/${newDate}`)
  if (originalDate && originalDate !== newDate) {
    revalidatePath(`/journal/${originalDate}`)
  }

  return { success: true, date: newDate }
}


function safeDateStr(date: unknown, fallback = ''): string {
  if (!date) return fallback
  const d = date instanceof Date ? date : new Date(date as string)
  if (isNaN(d.getTime())) return fallback
  return toLocalDateStr(d)
}
export async function getJournals(limit = 60) {
  const session = await getSession()
  const safeLimit = Math.min(Math.max(1, Math.floor(limit)), 365)

  const entries = await db.query.dailyJournals.findMany({
    where: eq(dailyJournals.userId, session.user.id),
    orderBy: [desc(dailyJournals.date)],
    limit: safeLimit,
  })

  return entries.map(e => ({
    ...e,
    dateString: safeDateStr(e.date),
  }))
}

export async function getJournalByDate(dateStr: string) {
  const session = await getSession()

  if (!DATE_REGEX.test(dateStr)) return null

  let from: Date, to: Date
  try {
    const range = getDayRange(dateStr)
    from = range.from
    to = range.to
  } catch {
    return null
  }

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
    // Fallback na URL datum ako je date u bazi invalid
    dateString: safeDateStr(entry.date, dateStr),
  }
}
export async function deleteJournal(id: string) {
  const session = await getSession()
  const userId = session.user.id

  if (!id || id.length > 50) return { error: 'Invalid ID' }

  // FIX: ownership provjera prije brisanja
  const existing = await db.query.dailyJournals.findFirst({
    where: and(
      eq(dailyJournals.id, id),
      eq(dailyJournals.userId, userId)
    ),
  })

  if (!existing) return { error: 'Not found' }

  await db.delete(dailyJournals).where(
    and(
      eq(dailyJournals.id, id),
      eq(dailyJournals.userId, userId)
    )
  )

  revalidatePath('/journal')
  return { success: true }
}