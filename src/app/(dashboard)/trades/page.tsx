//src/app/(dashboard)/trades/page.tsx

import Link from 'next/link'
import { Suspense } from 'react'
import { Plus } from 'lucide-react'
import { getTrades } from '@/actions/trades'
import { PageHeader } from '@/components/shared/page-header'
import { TradeTable } from '@/components/trades/trade-table'
import { TradeFilters } from '@/components/trades/trade-filters'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'
import type { TimePeriod } from '@/types/trade'

export const metadata: Metadata = { title: 'Trades' }

interface TradesPageProps {
  searchParams: Promise<{
    period?: string
    direction?: string
    status?: string
    symbol?: string
  }>
}

export default async function TradesPage({ searchParams }: TradesPageProps) {
  const params = await searchParams

  const trades = await getTrades({
    period: (params.period as TimePeriod) ?? 'month',
    direction: params.direction as 'LONG' | 'SHORT' | undefined,
    status: params.status,
    symbol: params.symbol,
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Trades" description="Your trading history and journal">
        <Button asChild>
          <Link href="/trades/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Trade
          </Link>
        </Button>
      </PageHeader>

      <div className="space-y-4">
        <Suspense>
          <TradeFilters />
        </Suspense>
        <TradeTable trades={trades} />
      </div>
    </div>
  )
}