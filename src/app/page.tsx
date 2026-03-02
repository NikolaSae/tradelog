//src/app/page.tsx
// src/app/page.tsx
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import LandingPage from './(marketing)/page'

export default async function RootPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (session) redirect('/dashboard')
  return <LandingPage />
}