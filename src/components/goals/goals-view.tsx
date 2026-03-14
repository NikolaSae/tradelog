//src/components/goals/goals-view.tsx
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Target } from 'lucide-react'
import { toast } from 'sonner'
import { createGoal, deleteGoal } from '@/actions/goals'
import type { GoalFormValues } from '@/actions/goals'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/shared/empty-state'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface GoalsViewProps {
  goals: any[]
  stats: any
}

const GOAL_TYPES = [
  { value: 'NET_PNL', label: 'Net P&L ($)' },
  { value: 'WIN_RATE', label: 'Win Rate (%)' },
  { value: 'TRADES', label: 'Number of Trades' },
  { value: 'PROFIT_FACTOR', label: 'Profit Factor' },
  { value: 'MAX_DRAWDOWN', label: 'Max Drawdown ($)' },
  { value: 'MAX_DAILY_LOSS', label: 'Max Daily Loss ($)' },
  { value: 'MIN_RRR', label: 'Min Risk/Reward' },
  { value: 'MAX_TRADES_PER_DAY', label: 'Max Trades/Day' },
] as const

const PERIODS = [
  { value: 'DAILY', label: 'Daily' },
  { value: 'WEEKLY', label: 'Weekly' },
  { value: 'MONTHLY', label: 'Monthly' },
  { value: 'QUARTERLY', label: 'Quarterly' },
  { value: 'YEARLY', label: 'Yearly' },
] as const

type GoalTypeValue = typeof GOAL_TYPES[number]['value']
type PeriodValue = typeof PERIODS[number]['value']

const VALID_TYPES = GOAL_TYPES.map(t => t.value) as string[]
const VALID_PERIODS = PERIODS.map(p => p.value) as string[]

function getCurrentValue(type: string, stats: any): number {
  switch (type) {
    case 'NET_PNL': return stats.totalNetPnl ?? 0
    case 'WIN_RATE': return stats.winRate ?? 0
    case 'TRADES': return stats.totalTrades ?? 0
    case 'PROFIT_FACTOR': return stats.profitFactor ?? 0
    default: return 0
  }
}

function formatGoalValue(type: string, value: number): string {
  if (['NET_PNL', 'MAX_DRAWDOWN', 'MAX_DAILY_LOSS'].includes(type)) return formatCurrency(value)
  if (type === 'WIN_RATE') return `${value}%`
  if (['PROFIT_FACTOR', 'MIN_RRR'].includes(type)) return value.toFixed(2)
  return value.toString()
}

export function GoalsView({ goals: initialGoals, stats }: GoalsViewProps) {
  const router = useRouter()
  const [goals, setGoals] = useState(initialGoals)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const submittingRef = useRef(false)
  const [form, setForm] = useState<GoalFormValues>({
    title: '',
    type: 'NET_PNL',
    targetValue: 0,
    period: 'MONTHLY',
  })

  function updateForm(key: keyof GoalFormValues, value: any) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleCreate() {
    // Client-side validacija
    const trimmedTitle = form.title.trim()
    if (!trimmedTitle) { toast.error('Title is required'); return }
    if (trimmedTitle.length > 100) { toast.error('Title is too long'); return }
    if (!VALID_TYPES.includes(form.type)) { toast.error('Invalid goal type'); return }
    if (!VALID_PERIODS.includes(form.period)) { toast.error('Invalid period'); return }
    if (!form.targetValue || form.targetValue <= 0 || form.targetValue > 10_000_000) {
      toast.error('Target must be a positive number')
      return
    }
    if (!Number.isFinite(form.targetValue)) { toast.error('Invalid target value'); return }
    if (submittingRef.current) return

    submittingRef.current = true
    setSaving(true)

    try {
      const result = await createGoal({ ...form, title: trimmedTitle })
      if (result.error) {
        toast.error(result.error)
        return
      }
      toast.success('Goal created')
      setShowForm(false)
      setForm({ title: '', type: 'NET_PNL', targetValue: 0, period: 'MONTHLY' })
      router.refresh() // umjesto window.location.reload()
    } catch {
      toast.error('Failed to create goal. Please try again.')
    } finally {
      setSaving(false)
      submittingRef.current = false
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteGoal(id)
      setGoals(g => g.filter((x: any) => x.id !== id))
      toast.success('Goal deleted')
    } catch {
      toast.error('Failed to delete goal.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold">New Goal</h3>

          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={e => updateForm('title', e.target.value.slice(0, 100))}
              placeholder="e.g. Make $2,000 this month"
              maxLength={100}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                value={form.type}
                onChange={e => {
                  if (VALID_TYPES.includes(e.target.value)) {
                    updateForm('type', e.target.value as GoalTypeValue)
                  }
                }}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                {GOAL_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Period</Label>
              <select
                value={form.period}
                onChange={e => {
                  if (VALID_PERIODS.includes(e.target.value)) {
                    updateForm('period', e.target.value as PeriodValue)
                  }
                }}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                {PERIODS.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Target Value</Label>
            <Input
              type="number"
              min={0.01}
              max={10_000_000}
              step={0.01}
              value={form.targetValue || ''}
              onChange={e => {
                const val = Number(e.target.value)
                if (isNaN(val) || val < 0 || val > 10_000_000) return
                updateForm('targetValue', val)
              }}
              placeholder="e.g. 2000"
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleCreate} disabled={saving} className="flex-1">
              {saving ? 'Creating...' : 'Create Goal'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {goals.length === 0 && !showForm ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Set monthly P&L targets, win rate goals, or any trading metric you want to improve."
        />
      ) : (
        <div className="grid gap-4">
          {goals.map((goal: any) => {
            const current = getCurrentValue(goal.type, stats)
            const target = Number(goal.targetValue)
            const progress = target !== 0
              ? Math.min(Math.max(Math.round((current / target) * 100), 0), 100)
              : 0
            const isComplete = progress >= 100

            const startStr = new Date(goal.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
            const endStr = new Date(goal.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

            return (
              <div
                key={goal.id}
                className={cn(
                  'bg-card border rounded-xl p-5 transition-colors',
                  isComplete ? 'border-emerald-500/30' : 'border-border'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">{goal.title}</h4>
                      {isComplete && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          ✓ Complete
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {goal.period} · {GOAL_TYPES.find(t => t.value === goal.type)?.label} · {startStr} – {endStr}
                    </p>
                  </div>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete goal?</AlertDialogTitle>
                        <AlertDialogDescription>
                          "{goal.title}" will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(goal.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Current: <strong className={cn(
                        current >= target ? 'text-emerald-500' : 'text-foreground'
                      )}>{formatGoalValue(goal.type, current)}</strong>
                    </span>
                    <span className="text-muted-foreground">
                      Target: <strong className="text-foreground">{formatGoalValue(goal.type, target)}</strong>
                    </span>
                  </div>
                  <Progress
                    value={progress}
                    className={cn('h-2', isComplete && '[&>div]:bg-emerald-500')}
                  />
                  <p className="text-xs text-muted-foreground text-right">{progress}% complete</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}