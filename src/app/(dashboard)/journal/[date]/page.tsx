//src/app/(dashboard)/journal/[date]/page.tsx
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getJournalByDate } from '@/actions/journal'
import { JournalForm } from '@/components/journal/journal-form'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ date: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { date } = await params
  return { title: `Journal — ${date}` }
}

export default async function JournalEntryPage({ params }: Props) {
  const { date } = await params
  const entry = await getJournalByDate(date)

  // Bezbjedno parsiranje datuma bez timezone pomaka
  const [year, month, day] = date.split('-').map(Number)
  const dateObj = new Date(year, month - 1, day)

  const todayStr = (() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  })()

  const isToday = date === todayStr
  const formatted = dateObj.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/journal">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Journal
        </Link>
      </Button>

      <PageHeader
        title={isToday ? "Today's Journal" : formatted}
        description={isToday ? formatted : `${entry ? 'Edit entry' : 'New entry'} for this day`}
      />

      <JournalForm date={date} defaultValues={entry ?? undefined} />
    </div>
  )
}