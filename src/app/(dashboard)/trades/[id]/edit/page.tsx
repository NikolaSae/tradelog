//src/app/(dashboard)/trades/[id]/edit/page.tsx
import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getTrade } from '@/actions/trades'
import { TradeForm } from '@/components/trades/trade-form'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const trade = await getTrade(id)
  return { title: trade ? `Edit ${trade.symbol}` : 'Edit Trade' }
}

export default async function EditTradePage({ params }: Props) {
  const { id } = await params
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const trade = await getTrade(id)
  if (!trade) notFound()

  // Formatiraj datume za form defaultValues
  function toDatetimeLocal(date: Date | null): string {
    if (!date) return ''
    // Format: YYYY-MM-DDTHH:mm:ss
    return date.toISOString().slice(0, 19)
  }

  const defaultValues = {
    symbol: trade.symbol,
    direction: trade.direction,
    status: trade.status,
    session: trade.session ?? undefined,
    entryPrice: Number(trade.entryPrice),
    exitPrice: trade.exitPrice ? Number(trade.exitPrice) : undefined,
    stopLoss: trade.stopLoss ? Number(trade.stopLoss) : undefined,
    takeProfit: trade.takeProfit ? Number(trade.takeProfit) : undefined,
    lotSize: Number(trade.lotSize),
    commission: Number(trade.commission ?? 0),
    swap: Number(trade.swap ?? 0),
    openedAt: toDatetimeLocal(trade.openedAt),
    closedAt: toDatetimeLocal(trade.closedAt),
    emotionTag: trade.emotionTag ?? undefined,
    notes: trade.notes ?? undefined,
    setupId: trade.setupId ?? undefined,
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/trades/${id}`}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Trade
        </Link>
      </Button>

      <PageHeader
        title={`Edit ${trade.symbol} trade`}
        description="Update trade details and recalculate P&L"
      />

      <div className="bg-card border border-border rounded-xl p-6">
        <TradeForm tradeId={id} defaultValues={defaultValues as any} />
      </div>
    </div>
  )
}