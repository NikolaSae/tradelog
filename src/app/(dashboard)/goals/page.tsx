//src/app/(dashboard)/goals/page.tsx
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getGoals } from '@/actions/goals'
import { PageHeader } from '@/components/shared/page-header'
import { UpgradeGate } from '@/components/shared/upgrade-gate'
import { GoalsView } from '@/components/goals/goals-view'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Goals' }

export default async function GoalsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  // getGoals sada sama računa currentValue — stats više nije potreban
  const goalsData = await getGoals()

  return (
    <div className="space-y-6">
      <PageHeader title="Goals" description="Set and track your trading targets" />
      <UpgradeGate feature="GOALS_SYSTEM">
        <GoalsView goals={goalsData as any} stats={{}} />
      </UpgradeGate>
    </div>
  )
}