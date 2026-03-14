//src/actions/profile.ts
'use server'

import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { users } from '@/db/schema'
import { auth } from '@/lib/auth'

const VALID_TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Belgrade',
  'Europe/Berlin', 'Europe/Paris', 'Asia/Tokyo',
  'Asia/Singapore', 'Asia/Dubai', 'Australia/Sydney',
] as const

const VALID_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF'] as const

const profileSchema = z.object({
  name: z.string().min(2).max(100),
  // Whitelist umjesto z.string() — sprječava arbitrary timezone/currency unos
  timezone: z.enum(VALID_TIMEZONES).optional(),
  currency: z.enum(VALID_CURRENCIES).optional(),
  nickname: z.string().max(50).optional().transform(s => s?.trim()),
  showOnLeaderboard: z.boolean().optional(),
})

export async function updateProfile(values: unknown) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return { error: 'Unauthorized' }

  const parsed = profileSchema.safeParse(values)
  if (!parsed.success) return { error: 'Invalid data' }

  await db.update(users).set({
    name: parsed.data.name,
    timezone: parsed.data.timezone,
    currency: parsed.data.currency,
    nickname: parsed.data.nickname ?? null,
    showOnLeaderboard: parsed.data.showOnLeaderboard ?? true,
    updatedAt: new Date(),
  }).where(eq(users.id, session.user.id))

  return { success: true }
}