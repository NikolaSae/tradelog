//src/app/(dashboard)/reports/page.tsx


import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { PageHeader } from '@/components/shared/page-header'
import { UpgradeGate } from '@/components/shared/upgrade-gate'
import { ExportPanel } from '@/components/reports/export-panel'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Reports & Export' }

export default async function ReportsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Reports & Export"
        description="Export your trade history to CSV or Excel"
      />
      <UpgradeGate feature="EXPORT">
        <ExportPanel />
      </UpgradeGate>
    </div>
  )
}