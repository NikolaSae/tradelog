// src/app/upgrade/page.tsx
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { CheckCircle, Zap } from 'lucide-react'
import { auth } from '@/lib/auth'
import { UpgradeButtons } from '@/components/upgrade/upgrade-buttons'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Upgrade to Pro' }

const proFeatures = [
  'Unlimited trades',
  'CSV / Excel import (cTrader, MT4, MT5)',
  'Full analytics suite',
  'Calendar heatmap',
  'Goals & targets',
  'Playbook library',
  'Export to CSV & Excel',
  'Email alerts',
]

const eliteFeatures = [
  'Everything in Pro',
  'Multi-account management',
  'Prop firm / mentor mode',
  'Full API access',
  'Priority support',
]

export default async function UpgradePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const userPlan = (session.user as any).plan ?? 'FREE'
  if (userPlan === 'ELITE') redirect('/settings/subscription')

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 text-xs font-medium px-3 py-1.5 rounded-full mb-4">
            <Zap className="h-3 w-3" />
            Upgrade your account
          </div>
          <h1 className="text-3xl font-bold mb-2">Unlock your full trading potential</h1>
          <p className="text-muted-foreground">
            Get unlimited trades, advanced analytics, and everything you need to grow.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Pro */}
          <div className="bg-card border-2 border-primary rounded-2xl p-6 relative">
            <div className="absolute -top-3 left-6">
              <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                Most Popular
              </span>
            </div>
            <div className="mb-6">
              <h2 className="text-xl font-bold">Pro</h2>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold">$15</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">or $120/year (save 33%)</p>
            </div>
            <ul className="space-y-2.5 mb-6">
              {proFeatures.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <UpgradeButtons plan="PRO" />
          </div>

          {/* Elite */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="mb-6">
              <h2 className="text-xl font-bold">Elite</h2>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-bold">$35</span>
                <span className="text-muted-foreground">/month</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">or $280/year (save 33%)</p>
            </div>
            <ul className="space-y-2.5 mb-6">
              {eliteFeatures.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <UpgradeButtons plan="ELITE" />
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Secure payment via Stripe · Cancel anytime · 7-day refund policy
        </p>
      </div>
    </div>
  )
}