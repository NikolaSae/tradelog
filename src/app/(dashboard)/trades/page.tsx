//src/app/(dashboard)/trades/page.tsx
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getTrades, getTradeSymbols } from '@/actions/trades'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import { TradeFilters } from '@/components/trades/trade-filters'
import { TradeTable } from '@/components/trades/trade-table'
import { TradePagination } from '@/components/trades/trade-pagination'
import type { Metadata } from 'next'
import type { TimePeriod } from '@/types/trade'

export const metadata: Metadata = { title: 'Trades' }

interface PageProps {
  searchParams: Promise<{
    page?: string
    period?: string
    symbol?: string
    direction?: string
    status?: string
  }>
}

export default async function TradesPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const period = (params.period ?? 'all') as TimePeriod
  const symbol = params.symbol ?? undefined
  const direction = params.direction as 'LONG' | 'SHORT' | undefined
  const status = params.status ?? undefined

  const [data, symbols] = await Promise.all([
    getTrades({ period, symbol, direction, status, page, limit: 20 }),
    getTradeSymbols(),
  ])

  return (
    <div className="space-y-4">
      <PageHeader title="Trades" description={`${data.total} total trades`}>
        <Button asChild size="sm">
          <Link href="/trades/new">
            <Plus className="h-4 w-4 mr-2" />
            New Trade
          </Link>
        </Button>
      </PageHeader>

      <TradeFilters
        symbols={symbols}
        currentPeriod={period}
        currentSymbol={symbol}
        currentDirection={direction}
        currentStatus={status}
      />

      <TradeTable trades={data.trades as any} />

      {data.totalPages > 1 && (
        <TradePagination
          page={data.page}
          totalPages={data.totalPages}
          total={data.total}
        />
      )}
    </div>
  )
}