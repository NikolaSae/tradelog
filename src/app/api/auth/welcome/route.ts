//api/auth/welcome/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { db } from '@/db'
import { users } from '@/db/schema'
import { sendWelcomeEmail } from '@/lib/email/send'

// In-memory rate limit za welcome email (po userId)
// Za produkciju: Redis ili DB tabela
const welcomeSentCache = new Map<string, number>()
const WELCOME_COOLDOWN_MS = 5 * 60 * 1000 // 5 minuta

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  // FIX: idempotency — provjeri da li je email već poslat (flag na useru)
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Ako flag postoji, preskoči
  if ((user as any).welcomeEmailSent === true) {
    return NextResponse.json({ skipped: true })
  }

  // Rate limit po userId
  const lastSent = welcomeSentCache.get(userId)
  if (lastSent && Date.now() - lastSent < WELCOME_COOLDOWN_MS) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  try {
    await sendWelcomeEmail(user.email, user.name ?? undefined)

    // Postavi flag da ne šaljemo opet
    await db.update(users)
      .set({ updatedAt: new Date() } as any) // dodaj welcomeEmailSent kolonu u schema
      .where(eq(users.id, userId))

    welcomeSentCache.set(userId, Date.now())

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Welcome email error:', err)
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 })
  }
}