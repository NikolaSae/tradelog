//src/components/upgrade/upgrade-buttons.tsx

'use client'

import { useState } from 'react'
import { createCheckoutSession } from '@/actions/subscriptions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { UpgradePlan } from '@/lib/stripe/plans'

interface UpgradeButtonsProps {
  plan: UpgradePlan
}

export function UpgradeButtons({ plan }: UpgradeButtonsProps) {
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly')
  const [loading, setLoading] = useState(false)

  async function handleUpgrade() {
    setLoading(true)
    try {
      await createCheckoutSession(plan, interval)
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Interval toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        {(['monthly', 'yearly'] as const).map(i => (
          <button
            key={i}
            onClick={() => setInterval(i)}
            className={cn(
              'flex-1 py-2 text-sm font-medium transition-colors',
              interval === i
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted/50'
            )}
          >
            {i === 'monthly' ? 'Monthly' : 'Yearly (-33%)'}
          </button>
        ))}
      </div>

      <Button
        onClick={handleUpgrade}
        disabled={loading}
        className="w-full"
        size="lg"
      >
        {loading ? 'Redirecting...' : `Upgrade to ${plan} — ${interval === 'monthly' ? (plan === 'PRO' ? '$15/mo' : '$35/mo') : (plan === 'PRO' ? '$120/yr' : '$280/yr')}`}
      </Button>
    </div>
  )
}