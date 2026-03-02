//src/app/(dashboard)/calendar/page.tsx

import { UpgradeGate } from '@/components/shared/upgrade-gate'
import { PageHeader } from '@/components/shared/page-header'
import { CalendarView } from '@/components/calendar/calendar-view'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Calendar' }

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <PageHeader title="Calendar" description="Daily P&L overview" />
      <UpgradeGate feature="CALENDAR_HEATMAP">
        <CalendarView />
      </UpgradeGate>
    </div>
  )
}