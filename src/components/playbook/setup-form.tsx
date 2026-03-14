//src/components/playbook/setup-form.tsx
'use client'

import { useState, useRef } from 'react'
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
  const submittingRef = useRef(false)
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
    // Client-side validacija
    if (!form.name.trim()) {
      toast.error('Setup name is required')
      return
    }
    if (form.name.trim().length > 100) {
      toast.error('Setup name is too long')
      return
    }
    if (submittingRef.current) return

    submittingRef.current = true
    setSaving(true)

    try {
      const result = isEdit
        ? await updateSetup(setup!.id, { ...form, name: form.name.trim() })
        : await createSetup({ ...form, name: form.name.trim() })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success(isEdit ? 'Setup updated' : 'Setup created')
      router.push(isEdit ? `/playbook/${setup!.id}` : '/playbook')
    } catch {
      toast.error('Failed to save setup. Please try again.')
    } finally {
      setSaving(false)
      submittingRef.current = false
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label>Setup Name *</Label>
        <Input
          value={form.name}
          onChange={e => update('name', e.target.value)}
          placeholder="e.g. London Breakout, ICT Order Block..."
          maxLength={100}
        />
      </div>

      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={e => update('description', e.target.value)}
          placeholder="Brief overview of this setup..."
          rows={2}
          maxLength={1000}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Timeframe</Label>
          <Input
            value={form.timeframe}
            onChange={e => update('timeframe', e.target.value)}
            placeholder="15m, 1H, 4H..."
            maxLength={50}
          />
        </div>
        <div className="space-y-2">
          <Label>Markets</Label>
          <Input
            value={form.markets}
            onChange={e => update('markets', e.target.value)}
            placeholder="EURUSD, Gold, NQ..."
            maxLength={200}
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
          maxLength={3000}
        />
      </div>

      <div className="space-y-2">
        <Label>Exit Rules</Label>
        <Textarea
          value={form.exitRules}
          onChange={e => update('exitRules', e.target.value)}
          placeholder="TP: ...&#10;SL: ..."
          rows={4}
          maxLength={3000}
        />
      </div>

      <div className="space-y-2">
        <Label>Risk Rules</Label>
        <Textarea
          value={form.riskRules}
          onChange={e => update('riskRules', e.target.value)}
          placeholder="Max risk per trade, lot sizing..."
          rows={3}
          maxLength={2000}
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