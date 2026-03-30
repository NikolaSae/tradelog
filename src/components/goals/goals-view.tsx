// src/components/goals/goals-view.tsx
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
  { value: 'TRADES', label: 'Min Trades' },
  { value: 'PROFIT_FACTOR', label: 'Profit Factor' },
  { value: 'MAX_DRAWDOWN', label: 'Max Drawdown ($) ↓' },
  { value: 'MAX_DAILY_LOSS', label: 'Max Daily Loss ($) ↓' },
  { value: 'MIN_RRR', label: 'Min Risk/Reward' },
  { value: 'MAX_TRADES_PER_DAY', label: 'Max Trades/Day ↓' },
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
const VALID_PERIODS_LIST = PERIODS.map(p => p.value) as string[]

// Tipovi gdje je cilj ostati ISPOD targeta
const LOWER_IS_BETTER = ['MAX_DRAWDOWN', 'MAX_DAILY_LOSS', 'MAX_TRADES_PER_DAY']

function isLowerIsBetter(type: string): boolean {
  return LOWER_IS_BETTER.includes(type)
}

function getCurrentValue(goal: any): number {
  return Number(goal.currentValue ?? 0)
}

function formatGoalValue(type: string, value: number): string {
  if (['NET_PNL', 'MAX_DRAWDOWN', 'MAX_DAILY_LOSS'].includes(type)) return formatCurrency(value)
  if (type === 'WIN_RATE') return `${value}%`
  if (['PROFIT_FACTOR', 'MIN_RRR'].includes(type)) return value.toFixed(2)
  return value.toString()
}

function calcProgress(current: number, target: number, lowerIsBetter: boolean): number {
  if (target === 0) return 0
  if (lowerIsBetter) {
    // 100% = ispod ili na limitu, 0% = duplo prekoračen
    if (current <= target) return 100
    // Prekoračen — smanjuj progress proporcionalno
    return Math.max(0, Math.round((1 - (current - target) / target) * 100))
  }
  return Math.min(Math.max(Math.round((current / target) * 100), 0), 100)
}

export function GoalsView({ goals: initialGoals }: GoalsViewProps) {
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
    const trimmedTitle = form.title.trim()
    if (!trimmedTitle) { toast.error('Title is required'); return }
    if (trimmedTitle.length > 100) { toast.error('Title is too long'); return }
    if (!VALID_TYPES.includes(form.type)) { toast.error('Invalid goal type'); return }
    if (!VALID_PERIODS_LIST.includes(form.period)) { toast.error('Invalid period'); return }
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
      if (result.error) { toast.error(result.error); return }
      toast.success('Goal created')
      setShowForm(false)
      setForm({ title: '', type: 'NET_PNL', targetValue: 0, period: 'MONTHLY' })
      router.refresh()
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
              placeholder="e.g. Max 10 trades per day"
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
                  if (VALID_PERIODS_LIST.includes(e.target.value)) {
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

          {/* Hint za lower-is-better tipove */}
          {isLowerIsBetter(form.type) && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              ↓ This is a limit goal — you want to stay <strong>below</strong> this value.
              Goal is met as long as current stays under the target.
            </p>
          )}

          <div className="space-y-2">
            <Label>
              {isLowerIsBetter(form.type) ? 'Limit Value' : 'Target Value'}
            </Label>
            <Input
              type="number"
              min={0.01}
              max={10_000_000}
              step={form.type === 'MAX_TRADES_PER_DAY' || form.type === 'TRADES' ? 1 : 0.01}
              value={form.targetValue || ''}
              onChange={e => {
                const val = Number(e.target.value)
                if (isNaN(val) || val < 0 || val > 10_000_000) return
                updateForm('targetValue', val)
              }}
              placeholder={
                form.type === 'MAX_TRADES_PER_DAY' ? '10' :
                form.type === 'MAX_DAILY_LOSS' ? '100' :
                form.type === 'MAX_DRAWDOWN' ? '500' :
                '2000'
              }
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
          description="Set monthly P&L targets, win rate goals, or trading limits to improve discipline."
        />
      ) : (
        <div className="grid gap-4">
          {goals.map((goal: any) => {
            const current = getCurrentValue(goal)
            const target = Number(goal.targetValue)
            const lowerIsBetter = isLowerIsBetter(goal.type)
            const progress = calcProgress(current, target, lowerIsBetter)

            // Za lower-is-better: uspjeh = ispod limita
            // Za higher-is-better: uspjeh = dostigao target
            const isComplete = lowerIsBetter
              ? current <= target
              : progress >= 100
            const isViolated = lowerIsBetter && current > target

            const startStr = new Date(goal.startDate).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short',
            })
            const endStr = new Date(goal.endDate).toLocaleDateString('en-GB', {
              day: 'numeric', month: 'short', year: 'numeric',
            })

            return (
              <div
                key={goal.id}
                className={cn(
                  'bg-card border rounded-xl p-5 transition-colors',
                  isViolated ? 'border-red-500/30'
                    : isComplete ? 'border-emerald-500/30'
                    : 'border-border'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-semibold">{goal.title}</h4>
                      {isViolated && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-500/10 text-red-500 border border-red-500/20">
                          ⚠ Limit exceeded
                        </span>
                      )}
                      {isComplete && !isViolated && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {lowerIsBetter ? '✓ On track' : '✓ Complete'}
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
                      Current:{' '}
                      <strong className={cn(
                        isViolated ? 'text-red-500'
                          : isComplete ? 'text-emerald-500'
                          : 'text-foreground'
                      )}>
                        {formatGoalValue(goal.type, current)}
                      </strong>
                    </span>
                    <span className="text-muted-foreground">
                      {lowerIsBetter ? 'Limit' : 'Target'}:{' '}
                      <strong className="text-foreground">
                        {formatGoalValue(goal.type, target)}
                      </strong>
                    </span>
                  </div>

                  <Progress
                    value={progress}
                    className={cn(
                      'h-2',
                      isViolated && '[&>div]:bg-red-500',
                      isComplete && !isViolated && '[&>div]:bg-emerald-500'
                    )}
                  />

                  <p className="text-xs text-muted-foreground text-right">
                    {lowerIsBetter
                      ? isViolated
                        ? `${formatGoalValue(goal.type, current - target)} over limit`
                        : `${formatGoalValue(goal.type, target - current)} remaining until limit`
                      : `${progress}% complete`}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}