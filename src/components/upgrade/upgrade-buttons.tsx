//src/components/upgrade/upgrade-buttons.tsx
'use client'

import { useState, useRef } from 'react'
import { createCheckoutSession } from '@/actions/subscriptions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { UpgradePlan } from '@/lib/stripe/plans'

const VALID_INTERVALS = ['monthly', 'yearly'] as const
type IntervalValue = typeof VALID_INTERVALS[number]

const VALID_PLANS = ['PRO', 'ELITE'] as const

const PLAN_PRICES: Record<string, Record<IntervalValue, string>> = {
  PRO: { monthly: '$15/mo', yearly: '$120/yr' },
  ELITE: { monthly: '$35/mo', yearly: '$280/yr' },
}

interface UpgradeButtonsProps {
  plan: UpgradePlan
}

export function UpgradeButtons({ plan }: UpgradeButtonsProps) {
  const [interval, setInterval] = useState<IntervalValue>('monthly')
  const [loading, setLoading] = useState(false)
  const checkoutRef = useRef(false)

  // Validacija plan prop-a
  const safePlan = VALID_PLANS.includes(plan as any) ? plan : 'PRO'
  const priceLabel = PLAN_PRICES[safePlan]?.[interval] ?? ''

  async function handleUpgrade() {
    if (checkoutRef.current) return
    if (!VALID_INTERVALS.includes(interval)) return
    if (!VALID_PLANS.includes(safePlan as any)) return

    checkoutRef.current = true
    setLoading(true)

    try {
      await createCheckoutSession(safePlan, interval)
    } catch {
      setLoading(false)
      checkoutRef.current = false
    }
  }

  return (
    <div className="space-y-3">
      {/* Interval toggle */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        {VALID_INTERVALS.map(i => (
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
        {loading
          ? 'Redirecting...'
          : `Upgrade to ${safePlan} — ${priceLabel}`}
      </Button>
    </div>
  )
}