//src/actions/profile.ts

'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  timezone: z.string().optional(),
  currency: z.string().length(3).optional(),
})

export type ProfileFormValues = z.infer<typeof profileSchema>

export async function updateProfile(values: ProfileFormValues) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')

  const parsed = profileSchema.safeParse(values)
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? 'Invalid data' }
  }

  await db
    .update(users)
    .set({
      name: parsed.data.name,
      updatedAt: new Date(),
    })
    .where(eq(users.id, session.user.id))

  revalidatePath('/settings/profile')
  return { success: true }
}