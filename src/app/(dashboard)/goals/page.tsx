//src/app/(dashboard)/goals/page.tsx
import { getGoals } from '@/actions/goals'
import { getTradeStats } from '@/actions/trades'
import { PageHeader } from '@/components/shared/page-header'
import { UpgradeGate } from '@/components/shared/upgrade-gate'
import { GoalsView } from '@/components/goals/goals-view'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Goals' }

export default async function GoalsPage() {
  const [goalsData, stats] = await Promise.all([
    getGoals(),
    getTradeStats('month'),
  ])

  return (
    <div className="space-y-6">
      <PageHeader title="Goals" description="Set and track your trading targets" />
      <UpgradeGate feature="GOALS_SYSTEM">
        <GoalsView goals={goalsData as any} stats={stats} />
      </UpgradeGate>
    </div>
  )
}