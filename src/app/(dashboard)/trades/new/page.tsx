//src/app/(dashboard)/trades/new/page.tsx

import { PageHeader } from '@/components/shared/page-header'
import { TradeForm } from '@/components/trades/trade-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Add Trade' }

export default function NewTradePage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <PageHeader
        title="Add Trade"
        description="Log a new trade to your journal"
      />
      <div className="bg-card border border-border rounded-xl p-6">
        <TradeForm />
      </div>
    </div>
  )
}