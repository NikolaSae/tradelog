//src/components/goals/goals-list.tsx

'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { createGoal, deleteGoal } from '@/actions/goals'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/shared/empty-state'
import { Target } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface GoalsListProps {
  goals: any[]
  stats: any
}

export function GoalsList({ goals: initialGoals, stats }: GoalsListProps) {
  const [goals, setGoals] = useState(initialGoals)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [type, setType] = useState('PNL')
  const [target, setTarget] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleCreate() {
    if (!title || !target) return
    setSaving(true)
    await createGoal({
      title,
      type,
      targetValue: Number(target),
      period: 'MONTHLY',
    })
    toast.success('Goal created')
    setShowForm(false)
    setTitle('')
    setTarget('')
    setSaving(false)
    // Refresh
    window.location.reload()
  }

  async function handleDelete(id: string) {
    await deleteGoal(id)
    setGoals(g => g.filter(x => x.id !== id))
    toast.success('Goal deleted')
  }

  // Auto-fill current value based on stats
  function getCurrentValue(goalType: string) {
    if (goalType === 'PNL') return stats.totalNetPnl
    if (goalType === 'WIN_RATE') return stats.winRate
    if (goalType === 'TRADES') return stats.totalTrades
    if (goalType === 'PROFIT_FACTOR') return stats.profitFactor
    return 0
  }

  return (
    <div className="space-y-4">
      {/* Add goal button */}
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Goal
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold">New Goal</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Hit $2000 this month" />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <select
                value={type}
                onChange={e => setType(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="PNL">Net P&L ($)</option>
                <option value="WIN_RATE">Win Rate (%)</option>
                <option value="TRADES">Number of Trades</option>
                <option value="PROFIT_FACTOR">Profit Factor</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Target Value</Label>
              <Input type="number" value={target} onChange={e => setTarget(e.target.value)} placeholder="1000" />
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? 'Creating...' : 'Create Goal'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Goals list */}
      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Set trading targets to stay focused and motivated"
        />
      ) : (
        <div className="grid gap-4">
          {goals.map((goal) => {
            const current = getCurrentValue(goal.type)
            const target = Number(goal.targetValue)
            const progress = Math.min(Math.round((current / target) * 100), 100)
            const isComplete = progress >= 100

            return (
              <div key={goal.id} className={cn(
                'bg-card border rounded-xl p-6',
                isComplete ? 'border-emerald-500/30' : 'border-border'
              )}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold">{goal.title}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{goal.period}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isComplete && <span className="text-emerald-500 text-sm font-medium">✓ Complete</span>}
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(goal.id)}>
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {goal.type === 'PNL' ? formatCurrency(current) : current}
                      {' / '}
                      {goal.type === 'PNL' ? formatCurrency(target) : target}
                      {goal.type === 'WIN_RATE' || goal.type === 'PROFIT_FACTOR' ? '' : ''}
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-xs text-muted-foreground text-right">{progress}%</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}