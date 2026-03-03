//src/actions/profile.ts

'use server'

import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { users } from '@/db/schema'
import { auth } from '@/lib/auth'

const profileSchema = z.object({
  name: z.string().min(2).max(100),
  timezone: z.string().max(50).optional(),
  currency: z.string().max(10).optional(),
  nickname: z.string().max(50).optional(),
  showOnLeaderboard: z.boolean().optional(),
})

export async function updateProfile(values: z.infer<typeof profileSchema>) {
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