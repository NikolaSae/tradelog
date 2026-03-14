//src/app/(dashboard)/analytics/report/page.tsx
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getAnalyticsReport } from '@/actions/analytics-report'
import { ReportView } from '@/components/analytics/report-view'
import { UpgradeGate } from '@/components/shared/upgrade-gate'
import type { Metadata } from 'next'
import type { TimePeriod } from '@/types/trade'

export const metadata: Metadata = { title: 'Performance Report' }

const VALID_PERIODS: TimePeriod[] = ['day', 'week', 'month', 'quarter', 'year', 'all']

interface PageProps {
  searchParams: Promise<{ period?: string }>
}

export default async function ReportPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const params = await searchParams

  // Validacija period-a — fallback na 'all' ako nije validan
  const rawPeriod = params.period ?? 'all'
  const period: TimePeriod = VALID_PERIODS.includes(rawPeriod as TimePeriod)
    ? (rawPeriod as TimePeriod)
    : 'all'

  const report = await getAnalyticsReport(period)

  return (
    <UpgradeGate feature="ANALYTICS">
      <ReportView report={report} period={period} />
    </UpgradeGate>
  )
}