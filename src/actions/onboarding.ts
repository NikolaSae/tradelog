//src/actions/onboarding.ts
'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { z } from 'zod'
import { db } from '@/db'
import { users, brokerAccounts } from '@/db/schema'
import { auth } from '@/lib/auth'

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

const onboardingSchema = z.object({
  // Korak 1 — lični podaci
  name: z.string().min(1).max(100).optional(),
  timezone: z.string().default('UTC'),
  currency: z.string().default('USD'),
  // Korak 2 — broker account
  brokerName: z.string().min(1).max(100),
  accountName: z.string().min(1).max(100),
  initialBalance: z.coerce.number().positive(),
  // Korak 3 — trading stil
  tradingStyle: z.enum(['SCALPER', 'DAY_TRADER', 'SWING_TRADER', 'POSITION_TRADER']).optional(),
  primaryMarkets: z.array(z.string()).optional(),
})

export type OnboardingValues = z.infer<typeof onboardingSchema>

export async function completeOnboarding(values: OnboardingValues) {
  const session = await getSession()
  const userId = session.user.id

  const parsed = onboardingSchema.safeParse(values)
  if (!parsed.success) return { error: 'Invalid data' }

  const data = parsed.data

  // Ažuriraj user profil
  await db.update(users).set({
    name: data.name ?? session.user.name,
    timezone: data.timezone,
    currency: data.currency,
    onboardingCompleted: true,
    updatedAt: new Date(),
  }).where(eq(users.id, userId))

  // Kreiraj broker account
  const existingDefault = await db.query.brokerAccounts.findFirst({
    where: eq(brokerAccounts.userId, userId),
  })

  if (!existingDefault) {
    await db.insert(brokerAccounts).values({
      id: nanoid(),
      userId,
      name: `${data.brokerName} — ${data.accountName}`,
      currency: data.currency,
      initialBalance: data.initialBalance.toString(),
      currentBalance: data.initialBalance.toString(),
      isDefault: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
  }

  return { success: true }
}

export async function skipOnboarding() {
  const session = await getSession()

  await db.update(users).set({
    onboardingCompleted: true,
    updatedAt: new Date(),
  }).where(eq(users.id, session.user.id))

  return { success: true }
}

export async function checkOnboardingStatus() {
  const session = await getSession()

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })

  return {
    completed: user?.onboardingCompleted ?? false,
    hasName: !!user?.name,
  }
}