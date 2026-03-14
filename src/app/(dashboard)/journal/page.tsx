//src/app/(dashboard)/journal/page.tsx

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getJournals } from '@/actions/journal'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import { toLocalDateStr } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Journal' }

const moodEmoji: Record<number, string> = {
  1: '😣', 2: '😟', 3: '😐', 4: '😊', 5: '🔥'
}

function getTodayStr(): string {
  const now = new Date()
  // UTC datum — konzistentno sa snimanjem
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
}

export default async function JournalPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const journals = await getJournals(60)
  const todayStr = getTodayStr()

  // FIX: koristimo dateString koji getJournals već priprema
  const hasToday = journals.some(j => j.dateString === todayStr)

  return (
    <div className="space-y-6">
      <PageHeader title="Journal" description="Daily trading diary and reflections">
        <Button asChild>
          <Link href={`/journal/${todayStr}`}>
            <Plus className="h-4 w-4 mr-2" />
            {hasToday ? "Today's Entry" : 'Write Today'}
          </Link>
        </Button>
      </PageHeader>

      {journals.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No journal entries yet"
          description="Reflect on your trades daily to improve your psychology and consistency. Even 5 minutes makes a difference."
          action={{
            label: "Write today's entry",
            href: `/journal/${todayStr}`,
          }}
        />
      ) : (
        <div className="space-y-3">
          {journals.map((entry) => {
            // FIX: koristimo dateString iz action-a, ne entry.date direktno
            const dateStr = entry.dateString
            const isToday = dateStr === todayStr

            // Bezbedno parsiranje za prikaz
            const [year, month, day] = dateStr
              ? dateStr.split('-').map(Number)
              : [0, 0, 0]
            const dateObj = dateStr
              ? new Date(year, month - 1, day)
              : null

            return (
              <Link
                key={entry.id}
                href={`/journal/${dateStr || '#'}`}
                className="block bg-card border border-border rounded-xl p-5 hover:border-border/60 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">
                        {isToday ? 'Today — ' : ''}
                        {dateObj && !isNaN(dateObj.getTime())
                          ? dateObj.toLocaleDateString('en-GB', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })
                          : 'Unknown date'}
                      </span>

                      {entry.mood && (
                        <span
                          className="text-lg leading-none"
                          title={`Mood: ${entry.mood}/5`}
                        >
                          {moodEmoji[entry.mood] ?? ''}
                        </span>
                      )}

                      {entry.rulesFollowed !== null && entry.rulesFollowed !== undefined && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          entry.rulesFollowed
                            ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                            : 'border-red-500/30 text-red-500 bg-red-500/10'
                        }`}>
                          {entry.rulesFollowed ? '✓ Rules followed' : '✗ Rules broken'}
                        </span>
                      )}

                      {isToday && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-primary/30 text-primary bg-primary/10">
                          Today
                        </span>
                      )}
                    </div>

                    {entry.postSessionNotes && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {entry.postSessionNotes}
                      </p>
                    )}

                    {!entry.postSessionNotes && entry.preSessionNotes && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {entry.preSessionNotes}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2 text-xs text-muted-foreground">
                    {entry.lessonsLearned && (
                      <span className="hidden sm:block">Has lessons</span>
                    )}
                    <span className="text-muted-foreground/40">→</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}