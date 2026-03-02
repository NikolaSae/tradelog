//src/components/settings/subscription-panel.tsx

'use client'

import Link from 'next/link'
import { useState } from 'react'
import { CreditCard, ExternalLink, CheckCircle } from 'lucide-react'
import { createPortalSession } from '@/actions/subscriptions'
import { Button } from '@/components/ui/button'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface SubscriptionPanelProps {
  plan: string
  subscription?: {
    status: string
    currentPeriodEnd: Date
    cancelAtPeriodEnd: boolean
    stripePriceId: string
  }
  billing: {
    id: string
    amount: number
    currency: string
    status: string | null
    date: Date
    invoiceUrl: string | null
  }[]
}

const planColors: Record<string, string> = {
  FREE: 'text-muted-foreground',
  PRO: 'text-primary',
  ELITE: 'text-purple-500',
}

const planBgs: Record<string, string> = {
  FREE: 'bg-muted',
  PRO: 'bg-primary/10',
  ELITE: 'bg-purple-500/10',
}

export function SubscriptionPanel({ plan, subscription, billing }: SubscriptionPanelProps) {
  const [loading, setLoading] = useState(false)
  const isPaid = plan !== 'FREE'

  async function handlePortal() {
    setLoading(true)
    try {
      await createPortalSession()
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Current plan */}
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Current Plan</h3>
          <span className={cn(
            'text-sm font-bold px-3 py-1 rounded-full',
            planBgs[plan],
            planColors[plan]
          )}>
            {plan}
          </span>
        </div>

        {isPaid && subscription ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium capitalize">{subscription.status.toLowerCase()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">
                  {subscription.cancelAtPeriodEnd ? 'Cancels on' : 'Renews on'}
                </p>
                <p className="font-medium">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('en-GB', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 text-sm text-orange-500">
                Your subscription will cancel at the end of the billing period.
              </div>
            )}

            <Button
              variant="outline"
              onClick={handlePortal}
              disabled={loading}
              className="w-full"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {loading ? 'Opening portal...' : 'Manage Subscription & Billing'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              You're on the Free plan. Upgrade to unlock unlimited trades, analytics, and more.
            </p>
            <Button asChild className="w-full">
              <Link href="/upgrade">Upgrade to Pro</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Billing history */}
      {billing.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Billing History</h3>
          <div className="space-y-2">
            {billing.map(inv => (
              <div
                key={inv.id}
                className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium">
                    {new Date(inv.date).toLocaleDateString('en-GB', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{inv.status}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">
                    {formatCurrency(inv.amount, inv.currency)}
                  </span>
                  {inv.invoiceUrl && (
                    <a
                      href={inv.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}