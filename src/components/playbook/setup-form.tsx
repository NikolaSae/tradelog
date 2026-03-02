//src/components/playbook/setup-form.tsx

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createSetup, updateSetup } from '@/actions/playbook'
import type { SetupFormValues } from '@/actions/playbook'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface SetupFormProps {
  setup?: {
    id: string
    name: string
    description?: string | null
    timeframe?: string | null
    markets?: string | null
    entryRules?: string | null
    exitRules?: string | null
    riskRules?: string | null
  }
}

export function SetupForm({ setup }: SetupFormProps) {
  const router = useRouter()
  const isEdit = !!setup
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<SetupFormValues>({
    name: setup?.name ?? '',
    description: setup?.description ?? '',
    timeframe: setup?.timeframe ?? '',
    markets: setup?.markets ?? '',
    entryRules: setup?.entryRules ?? '',
    exitRules: setup?.exitRules ?? '',
    riskRules: setup?.riskRules ?? '',
  })

  function update(key: keyof SetupFormValues, value: string) {
    setForm(f => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    setSaving(true)
    const result = isEdit
      ? await updateSetup(setup!.id, form)
      : await createSetup(form)

    if (result.error) {
      toast.error(result.error)
      setSaving(false)
      return
    }

    toast.success(isEdit ? 'Setup updated' : 'Setup created')
    router.push(isEdit ? `/playbook/${setup!.id}` : '/playbook')
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Setup Name *</Label>
        <Input
          value={form.name}
          onChange={e => update('name', e.target.value)}
          placeholder="e.g. London Breakout, ICT Order Block..."
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={e => update('description', e.target.value)}
          placeholder="Brief overview of this setup..."
          rows={2}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Timeframe</Label>
          <Input
            value={form.timeframe}
            onChange={e => update('timeframe', e.target.value)}
            placeholder="15m, 1H, 4H..."
          />
        </div>
        <div className="space-y-2">
          <Label>Markets</Label>
          <Input
            value={form.markets}
            onChange={e => update('markets', e.target.value)}
            placeholder="EURUSD, Gold, NQ..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Entry Rules</Label>
        <Textarea
          value={form.entryRules}
          onChange={e => update('entryRules', e.target.value)}
          placeholder="What conditions must be met to enter?&#10;1. ..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Exit Rules</Label>
        <Textarea
          value={form.exitRules}
          onChange={e => update('exitRules', e.target.value)}
          placeholder="TP: ...&#10;SL: ..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Risk Rules</Label>
        <Textarea
          value={form.riskRules}
          onChange={e => update('riskRules', e.target.value)}
          placeholder="Max risk per trade, lot sizing..."
          rows={3}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSubmit} disabled={saving} className="flex-1">
          {saving
            ? isEdit ? 'Updating...' : 'Creating...'
            : isEdit ? 'Update Setup' : 'Create Setup'}
        </Button>
        <Button variant="outline" onClick={() => router.back()} disabled={saving}>
          Cancel
        </Button>
      </div>
    </div>
  )
}