//src/actions/playbook.ts
'use server'

import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { nanoid } from 'nanoid'
import { eq, and, desc } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { playbookSetups } from '@/db/schema'
import { auth } from '@/lib/auth'

const setupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(1000).optional(),
  timeframe: z.string().max(50).optional(),
  markets: z.string().max(200).optional(),
  entryRules: z.string().max(3000).optional(),
  exitRules: z.string().max(3000).optional(),
  riskRules: z.string().max(2000).optional(),
})

export type SetupFormValues = z.infer<typeof setupSchema>

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

export async function getSetups() {
  const session = await getSession()
  return db.query.playbookSetups.findMany({
    where: eq(playbookSetups.userId, session.user.id),
    orderBy: [desc(playbookSetups.createdAt)],
  })
}

export async function getSetup(id: string) {
  const session = await getSession()
  return db.query.playbookSetups.findFirst({
    where: and(
      eq(playbookSetups.id, id),
      eq(playbookSetups.userId, session.user.id)
    ),
  }) ?? null
}

export async function createSetup(values: SetupFormValues) {
  const session = await getSession()
  const parsed = setupSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid data' }

  const id = nanoid()
  await db.insert(playbookSetups).values({
    id,
    userId: session.user.id,
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    timeframe: parsed.data.timeframe ?? null,
    markets: parsed.data.markets ?? null,
    entryRules: parsed.data.entryRules ?? null,
    exitRules: parsed.data.exitRules ?? null,
    riskRules: parsed.data.riskRules ?? null,
    isActive: true,
    isPublic: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  revalidatePath('/playbook')
  return { success: true, id }
}

export async function updateSetup(id: string, values: SetupFormValues) {
  const session = await getSession()
  const parsed = setupSchema.safeParse(values)
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? 'Invalid data' }

  await db.update(playbookSetups)
    .set({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      timeframe: parsed.data.timeframe ?? null,
      markets: parsed.data.markets ?? null,
      entryRules: parsed.data.entryRules ?? null,
      exitRules: parsed.data.exitRules ?? null,
      riskRules: parsed.data.riskRules ?? null,
      updatedAt: new Date(),
    })
    .where(and(
      eq(playbookSetups.id, id),
      eq(playbookSetups.userId, session.user.id)
    ))

  revalidatePath('/playbook')
  revalidatePath(`/playbook/${id}`)
  return { success: true }
}

export async function deleteSetup(id: string) {
  const session = await getSession()
  await db.delete(playbookSetups).where(
    and(
      eq(playbookSetups.id, id),
      eq(playbookSetups.userId, session.user.id)
    )
  )
  revalidatePath('/playbook')
  return { success: true }
}