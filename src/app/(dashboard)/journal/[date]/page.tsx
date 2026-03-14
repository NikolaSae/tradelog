//src/app/(dashboard)/journal/[date]/page.tsx
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { auth } from '@/lib/auth'
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
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const { date } = await params

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect('/journal')

  const now = new Date()
  const todayStr = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
  if (date > todayStr) redirect('/journal')

  const entry = await getJournalByDate(date)

  const [year, month, day] = date.split('-').map(Number)
  const dateObj = new Date(year, month - 1, day)
  const isToday = date === todayStr

  const formatted = dateObj.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
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
      {/* key={date} osigurava da se forma potpuno resetuje kada se mijenja datum u URL-u */}
      <JournalForm
        key={date}
        date={date}
        defaultValues={entry ? {
          id: entry.id, // ← proslijedi ID
          mood: entry.mood,
          preSessionNotes: entry.preSessionNotes,
          postSessionNotes: entry.postSessionNotes,
          lessonsLearned: entry.lessonsLearned,
          rulesFollowed: entry.rulesFollowed,
          marketConditions: entry.marketConditions,
          planForTomorrow: entry.planForTomorrow,
        } : undefined}
      />
    </div>
  )
}