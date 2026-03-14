// src/components/journal/journal-form.tsx
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { upsertJournal } from '@/actions/journal'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface JournalFormProps {
  date: string
  defaultValues?: {
    id?: string // ← dodati
    mood?: number | null
    preSessionNotes?: string | null
    postSessionNotes?: string | null
    lessonsLearned?: string | null
    rulesFollowed?: boolean | null
    marketConditions?: string | null
    planForTomorrow?: string | null
  }
}

const MOODS = [
  { value: 1, emoji: '😣', label: 'Terrible' },
  { value: 2, emoji: '😟', label: 'Bad' },
  { value: 3, emoji: '😐', label: 'Neutral' },
  { value: 4, emoji: '😊', label: 'Good' },
  { value: 5, emoji: '🔥', label: 'Great' },
]

function getTodayStr(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
}

export function JournalForm({ date: initialDate, defaultValues }: JournalFormProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const submittingRef = useRef(false)

  // Datum je editabilan — korisnik može promijeniti
  const [date, setDate] = useState(initialDate)
  const today = getTodayStr()

  const isEdit = !!defaultValues

  const [mood, setMood] = useState<number | undefined>(defaultValues?.mood ?? undefined)
  const [rulesFollowed, setRulesFollowed] = useState<boolean | undefined>(
    defaultValues?.rulesFollowed ?? undefined
  )
  const [preSessionNotes, setPreSessionNotes] = useState(defaultValues?.preSessionNotes ?? '')
  const [postSessionNotes, setPostSessionNotes] = useState(defaultValues?.postSessionNotes ?? '')
  const [lessonsLearned, setLessonsLearned] = useState(defaultValues?.lessonsLearned ?? '')
  const [marketConditions, setMarketConditions] = useState(defaultValues?.marketConditions ?? '')
  const [planForTomorrow, setPlanForTomorrow] = useState(defaultValues?.planForTomorrow ?? '')

  function handleDateChange(val: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) return
    if (val > today) {
      toast.error('Cannot create journal entry for a future date')
      return
    }
    setDate(val)
  }

  async function handleSave() {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    toast.error('Invalid date')
    return
  }
  if (date > today) {
    toast.error('Cannot create journal entry for a future date')
    return
  }
  if (submittingRef.current) return

  submittingRef.current = true
  setSaving(true)

  try {
    const result = await upsertJournal(
  {
    id: defaultValues?.id, // ← dodati
    date,
    mood,
    rulesFollowed,
    preSessionNotes: preSessionNotes.trim() || undefined,
    postSessionNotes: postSessionNotes.trim() || undefined,
    lessonsLearned: lessonsLearned.trim() || undefined,
    marketConditions: marketConditions.trim() || undefined,
    planForTomorrow: planForTomorrow.trim() || undefined,
  },
  initialDate
)

    if (result.error) {
      toast.error(result.error)
      return // finally će resetovati state
    }

    toast.success('Journal entry saved')
    const savedDate = result.date ?? date
    // Ukloniti router.refresh() — revalidatePath na serveru je dovoljan
    router.push(`/journal`)
  } catch {
    toast.error('Failed to save journal entry.')
  } finally {
    setSaving(false)
    submittingRef.current = false
  }
}

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-6">

      {/* Date picker — uvijek vidljiv, i za create i za edit */}
      <div className="space-y-1.5">
        <Label htmlFor="journal-date">
          Date
          {isEdit && (
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              (changing date will move this entry)
            </span>
          )}
        </Label>
        <Input
          id="journal-date"
          type="date"
          value={date}
          max={today}
          onChange={e => handleDateChange(e.target.value)}
          className="max-w-[200px]"
        />
        {date !== initialDate && (
          <p className="text-xs text-amber-500">
            ⚠ Entry will be saved under new date: {date}
          </p>
        )}
      </div>

      {/* Mood */}
      <div className="space-y-3">
        <Label>How did today go?</Label>
        <div className="flex gap-2">
          {MOODS.map((m) => (
            <button
              key={m.value}
              type="button"
              onClick={() => setMood(mood === m.value ? undefined : m.value)}
              className={cn(
                'flex flex-col items-center gap-1 p-3 rounded-xl border transition-all flex-1',
                mood === m.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-border/80 hover:bg-muted/50'
              )}
            >
              <span className="text-2xl">{m.emoji}</span>
              <span className="text-xs text-muted-foreground">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Rules followed */}
      <div className="space-y-2">
        <Label>Did you follow your rules?</Label>
        <div className="flex gap-3">
          {[
            { value: true, label: '✓ Yes', className: 'border-emerald-500/30 text-emerald-500 bg-emerald-500/10' },
            { value: false, label: '✗ No', className: 'border-red-500/30 text-red-500 bg-red-500/10' },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => setRulesFollowed(rulesFollowed === opt.value ? undefined : opt.value)}
              className={cn(
                'flex-1 py-2 rounded-lg border text-sm font-medium transition-all',
                rulesFollowed === opt.value ? opt.className : 'border-border hover:bg-muted/50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="pre">Pre-Session Plan</Label>
        <Textarea
          id="pre"
          value={preSessionNotes}
          onChange={e => setPreSessionNotes(e.target.value)}
          placeholder="What's your plan for today? Key levels, setups to watch..."
          rows={3}
          maxLength={3000}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="post">Post-Session Notes</Label>
        <Textarea
          id="post"
          value={postSessionNotes}
          onChange={e => setPostSessionNotes(e.target.value)}
          placeholder="What happened today? How did your trades go?"
          rows={4}
          maxLength={3000}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lessons">Lessons Learned</Label>
        <Textarea
          id="lessons"
          value={lessonsLearned}
          onChange={e => setLessonsLearned(e.target.value)}
          placeholder="What would you do differently? Key takeaways..."
          rows={3}
          maxLength={2000}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="market">Market Conditions</Label>
        <Textarea
          id="market"
          value={marketConditions}
          onChange={e => setMarketConditions(e.target.value)}
          placeholder="How was the market? Trending, ranging, news-driven..."
          rows={2}
          maxLength={500}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="plan">Plan for Tomorrow</Label>
        <Textarea
          id="plan"
          value={planForTomorrow}
          onChange={e => setPlanForTomorrow(e.target.value)}
          placeholder="What are you watching tomorrow? Key levels or setups..."
          rows={2}
          maxLength={1000}
        />
      </div>

      <div className="flex gap-3">
        <Button onClick={handleSave} disabled={saving} className="flex-1">
          {saving ? 'Saving...' : 'Save Entry'}
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push('/journal')}
          disabled={saving}
        >
          Cancel
        </Button>
      </div>
    </div>
  )
}