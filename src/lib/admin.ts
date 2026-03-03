//src/lib/admin.ts


import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) redirect('/login')

  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail || session.user.email !== adminEmail) {
    redirect('/dashboard')
  }

  return session
}