//src/app/(dashboard)/alerts/page.tsx

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getAlerts } from '@/actions/alerts'
import { PageHeader } from '@/components/shared/page-header'
import { UpgradeGate } from '@/components/shared/upgrade-gate'
import { AlertsView } from '@/components/alerts/alerts-view'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Alerts' }

export default async function AlertsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const userAlerts = await getAlerts()

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader
        title="Alerts"
        description="Get notified when important thresholds are hit"
      />
      <UpgradeGate feature="ALERTS">
        <AlertsView alerts={userAlerts as any} />
      </UpgradeGate>
    </div>
  )
}