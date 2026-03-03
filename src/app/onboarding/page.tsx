//src/app/onboarding/page.tsx

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { checkOnboardingStatus } from '@/actions/onboarding'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Welcome to Tradelog' }

export default async function OnboardingPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const status = await checkOnboardingStatus()
  if (status.completed) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <OnboardingWizard
        userName={session.user.name ?? undefined}
        userEmail={session.user.email}
      />
    </div>
  )
}