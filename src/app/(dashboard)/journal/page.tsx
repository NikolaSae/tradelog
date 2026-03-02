//src/app/(dashboard)/journal/page.tsx
import Link from 'next/link'
import { Plus, BookOpen } from 'lucide-react'
import { getJournals } from '@/actions/journal'
import { PageHeader } from '@/components/shared/page-header'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Journal' }

const moodEmoji: Record<number, string> = { 1: '😣', 2: '😟', 3: '😐', 4: '😊', 5: '🔥' }

function getTodayDate() {
  return new Date().toISOString().split('T')[0]
}

export default async function JournalPage() {
  const journals = await getJournals(60)
  const todayDate = getTodayDate()
  const hasToday = journals.some((j) => j.date === todayDate)

  return (
    <div className="space-y-6">
      <PageHeader title="Journal" description="Daily trading diary and reflections">
        <Button asChild>
          <Link href={`/journal/${todayDate}`}>
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
            href: `/journal/${todayDate}`,
          }}
        />
      ) : (
        <div className="space-y-3">
          {journals.map((entry) => {
            const isToday = entry.date === todayDate
            const dateObj = new Date(entry.date + 'T12:00:00') // avoid timezone offset

            return (
              <Link
                key={entry.id}
                href={`/journal/${entry.date}`}
                className="block bg-card border border-border rounded-xl p-5 hover:border-border/60 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">
                        {isToday ? 'Today — ' : ''}
                        {dateObj.toLocaleDateString('en-GB', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>

                      {entry.mood && (
                        <span className="text-lg leading-none" title={`Mood: ${entry.mood}/5`}>
                          {moodEmoji[entry.mood]}
                        </span>
                      )}

                      {entry.rulesFollowed !== null && (
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                            entry.rulesFollowed
                              ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10'
                              : 'border-red-500/30 text-red-500 bg-red-500/10'
                          }`}
                        >
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

                  {/* Right side indicator */}
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