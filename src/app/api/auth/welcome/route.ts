//api/auth/welcome/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { sendWelcomeEmail } from '@/lib/email/send'

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await sendWelcomeEmail(session.user.email, session.user.name ?? undefined)
  return NextResponse.json({ success: true })
}