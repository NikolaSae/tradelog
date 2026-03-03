//src/components/alerts/alerts-view.tsx

'use client'

import { useState } from 'react'
import { Plus, Trash2, Bell, BellOff } from 'lucide-react'
import { toast } from 'sonner'
import { createAlert, deleteAlert, toggleAlert } from '@/actions/alerts'
import type { AlertFormValues } from '@/actions/alerts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { EmptyState } from '@/components/shared/empty-state'
import { cn } from '@/lib/utils'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface Alert {
  id: string
  type: string
  threshold: string
  isActive: boolean
  lastFired: Date | null
}

interface AlertsViewProps {
  alerts: Alert[]
}

const ALERT_TYPES = [
  {
    value: 'DAILY_LOSS_LIMIT',
    label: 'Daily Loss Limit',
    description: 'Alert when daily loss exceeds this amount',
    unit: '$',
    placeholder: '100',
    icon: '🛑',
  },
  {
    value: 'DRAWDOWN_LIMIT',
    label: 'Drawdown Limit',
    description: 'Alert when total drawdown exceeds this amount',
    unit: '$',
    placeholder: '500',
    icon: '📉',
  },
  {
    value: 'LOSING_STREAK',
    label: 'Losing Streak',
    description: 'Alert after N consecutive losing trades',
    unit: 'trades',
    placeholder: '3',
    icon: '🔴',
  },
  {
    value: 'OVERTRADING',
    label: 'Overtrading',
    description: 'Alert when you exceed N trades per day',
    unit: 'trades/day',
    placeholder: '10',
    icon: '⚡',
  },
]

function getAlertMeta(type: string) {
  return ALERT_TYPES.find(a => a.value === type) ?? {
    label: type,
    description: '',
    unit: '',
    icon: '🔔',
  }
}

export function AlertsView({ alerts: initialAlerts }: AlertsViewProps) {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<AlertFormValues>({
    type: 'DAILY_LOSS_LIMIT',
    threshold: 0,
  })

  async function handleCreate() {
    setSaving(true)
    const result = await createAlert(form)
    setSaving(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success('Alert created')
    setShowForm(false)
    window.location.reload()
  }

  async function handleToggle(id: string) {
    await toggleAlert(id)
    setAlerts(prev =>
      prev.map(a => a.id === id ? { ...a, isActive: !a.isActive } : a)
    )
  }

  async function handleDelete(id: string) {
    await deleteAlert(id)
    setAlerts(prev => prev.filter(a => a.id !== id))
    toast.success('Alert deleted')
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Alert
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-semibold">New Alert</h3>

          <div className="space-y-2">
            <Label>Alert Type</Label>
            <div className="grid grid-cols-1 gap-2">
              {ALERT_TYPES.map(type => (
                <button
                  key={type.value}
                  onClick={() => setForm(f => ({ ...f, type: type.value as any }))}
                  className={cn(
                    'flex items-center gap-3 p-3 rounded-lg border text-left transition-all',
                    form.type === type.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:bg-muted/30'
                  )}
                >
                  <span className="text-xl">{type.icon}</span>
                  <div>
                    <p className="text-sm font-medium">{type.label}</p>
                    <p className="text-xs text-muted-foreground">{type.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              Threshold ({getAlertMeta(form.type).unit})
            </Label>
            <Input
              type="number"
              value={form.threshold || ''}
              onChange={e => setForm(f => ({ ...f, threshold: Number(e.target.value) }))}
              placeholder={getAlertMeta(form.type).placeholder}
            />
          </div>

          <div className="flex gap-3">
            <Button onClick={handleCreate} disabled={saving} className="flex-1">
              {saving ? 'Creating...' : 'Create Alert'}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Alerts list */}
      {alerts.length === 0 && !showForm ? (
        <EmptyState
          icon={Bell}
          title="No alerts yet"
          description="Set up alerts to protect yourself from overtrading, daily loss limits, and losing streaks."
        />
      ) : (
        <div className="space-y-3">
          {alerts.map(alert => {
            const meta = getAlertMeta(alert.type)
            return (
              <div
                key={alert.id}
                className={cn(
                  'bg-card border rounded-xl p-5 flex items-center gap-4 transition-colors',
                  alert.isActive ? 'border-border' : 'border-border/40 opacity-60'
                )}
              >
                <span className="text-2xl">{meta.icon}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm">{meta.label}</p>
                    {!alert.isActive && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Paused
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Threshold: {['DAILY_LOSS_LIMIT', 'DRAWDOWN_LIMIT'].includes(alert.type) ? '$' : ''}
                    {Number(alert.threshold)}{' '}
                    {['LOSING_STREAK', 'OVERTRADING'].includes(alert.type) ? meta.unit : ''}
                  </p>
                  {alert.lastFired && (
                    <p className="text-xs text-orange-500 mt-0.5">
                      Last triggered: {new Date(alert.lastFired).toLocaleDateString('en-GB', {
                        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(alert.id)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title={alert.isActive ? 'Pause alert' : 'Enable alert'}
                  >
                    {alert.isActive
                      ? <Bell className="h-4 w-4" />
                      : <BellOff className="h-4 w-4" />
                    }
                  </button>

                  {/* Delete */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {meta.label}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This alert will be permanently deleted.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(alert.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}