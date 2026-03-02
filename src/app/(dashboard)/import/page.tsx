//src/app/(dashboard)/import/page.tsx


import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { hasFeatureAccess } from '@/config/plans'
import { PageHeader } from '@/components/shared/page-header'
import { ImportForm } from '@/components/import/import-form'
import { UpgradeGate } from '@/components/shared/upgrade-gate'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Import Trades' }

export default async function ImportPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Import Trades"
        description="Import your trade history from cTrader or any CSV file"
      />
      <UpgradeGate feature="CSV_IMPORT">
        <ImportForm />
      </UpgradeGate>
    </div>
  )
}