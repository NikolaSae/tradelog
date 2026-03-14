//src/components/onboarding/onboarding-wizard.tsx
'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { completeOnboarding, skipOnboarding } from '@/actions/onboarding'
import type { OnboardingValues } from '@/actions/onboarding'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import {
  ChevronRight, ChevronLeft, Check,
  TrendingUp, Target, BookOpen, Zap,
} from 'lucide-react'

const TOTAL_STEPS = 4

const TIMEZONES = [
  'UTC', 'Europe/London', 'Europe/Belgrade', 'Europe/Berlin',
  'Europe/Paris', 'America/New_York', 'America/Los_Angeles',
  'Asia/Tokyo', 'Asia/Dubai',
] as const

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CHF', 'JPY', 'AUD'] as const

const MARKETS = ['Forex', 'Gold/Silver', 'Indices', 'Crypto', 'Commodities', 'Stocks'] as const

const TRADING_STYLES = [
  { value: 'SCALPER', label: 'Scalper', desc: 'Seconds to minutes per trade', icon: '⚡' },
  { value: 'DAY_TRADER', label: 'Day Trader', desc: 'Open and close within the day', icon: '📊' },
  { value: 'SWING_TRADER', label: 'Swing Trader', desc: 'Days to weeks', icon: '🌊' },
  { value: 'POSITION_TRADER', label: 'Position Trader', desc: 'Weeks to months', icon: '🏔️' },
] as const

type TimezoneValue = typeof TIMEZONES[number]
type CurrencyValue = typeof CURRENCIES[number]
type TradingStyleValue = typeof TRADING_STYLES[number]['value']

const VALID_TIMEZONES = TIMEZONES as readonly string[]
const VALID_CURRENCIES = CURRENCIES as readonly string[]
const VALID_STYLES = TRADING_STYLES.map(s => s.value) as string[]
const VALID_MARKETS = MARKETS as readonly string[]

interface OnboardingWizardProps {
  userName?: string
  userEmail: string
}

export function OnboardingWizard({ userName, userEmail }: OnboardingWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const submittingRef = useRef(false)

  const [values, setValues] = useState<Partial<OnboardingValues>>({
    name: userName ?? '',
    timezone: 'UTC',
    currency: 'USD',
    brokerName: '',
    accountName: 'Live Account',
    initialBalance: 10000,
    tradingStyle: undefined,
    primaryMarkets: [],
  })

  function update(key: keyof OnboardingValues, value: any) {
    setValues(v => ({ ...v, [key]: value }))
  }

  function toggleMarket(market: string) {
    // Samo dozvoljeni marketi
    if (!VALID_MARKETS.includes(market)) return
    const current = values.primaryMarkets ?? []
    if (current.includes(market)) {
      update('primaryMarkets', current.filter(m => m !== market))
    } else {
      // Max 6 marketa
      if (current.length >= 6) return
      update('primaryMarkets', [...current, market])
    }
  }

  async function handleFinish() {
    if (submittingRef.current) return
    submittingRef.current = true
    setSaving(true)

    try {
      const result = await completeOnboarding(values as OnboardingValues)
      if (result.error) {
        toast.error(result.error)
        return
      }
      router.push('/dashboard')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setSaving(false)
      submittingRef.current = false
    }
  }

  async function handleSkip() {
    try {
      await skipOnboarding()
      router.push('/dashboard')
    } catch {
      router.push('/dashboard')
    }
  }

  function canProceed() {
    if (step === 2) {
      const bal = values.initialBalance ?? 0
      return !!values.brokerName?.trim() && bal > 0 && bal <= 100_000_000
    }
    return true
  }

  return (
    <div className="w-full max-w-lg">
      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-all',
              i + 1 <= step ? 'bg-primary' : 'bg-muted'
            )}
          />
        ))}
      </div>

      {/* Step 1 — Welcome */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Welcome to Tradelog 👋</h1>
            <p className="text-muted-foreground">
              Let's set up your account in a few quick steps.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input
                value={values.name ?? ''}
                onChange={e => update('name', e.target.value.slice(0, 100))}
                placeholder="How should we call you?"
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Timezone</Label>
                <select
                  value={values.timezone}
                  onChange={e => {
                    if (VALID_TIMEZONES.includes(e.target.value)) {
                      update('timezone', e.target.value as TimezoneValue)
                    }
                  }}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Currency</Label>
                <select
                  value={values.currency}
                  onChange={e => {
                    if (VALID_CURRENCIES.includes(e.target.value)) {
                      update('currency', e.target.value as CurrencyValue)
                    }
                  }}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
                >
                  {CURRENCIES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2 — Broker Account */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold">Set up your account</h2>
            <p className="text-muted-foreground">
              This helps us calculate your performance accurately.
            </p>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <div className="space-y-2">
              <Label>Broker Name *</Label>
              <Input
                value={values.brokerName ?? ''}
                onChange={e => update('brokerName', e.target.value.slice(0, 100))}
                placeholder="e.g. IC Markets, Pepperstone"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Account Name</Label>
              <Input
                value={values.accountName ?? ''}
                onChange={e => update('accountName', e.target.value.slice(0, 100))}
                placeholder="e.g. Live Account, Prop Firm"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label>Starting Balance *</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  {values.currency === 'EUR' ? '€' : values.currency === 'GBP' ? '£' : '$'}
                </span>
                <Input
                  type="number"
                  className="pl-7"
                  min={1}
                  max={100_000_000}
                  value={values.initialBalance ?? ''}
                  onChange={e => {
                    const val = Number(e.target.value)
                    if (isNaN(val) || val < 0 || val > 100_000_000) return
                    update('initialBalance', val)
                  }}
                  placeholder="10000"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Used as the starting point for your equity curve.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 3 — Trading Style */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold">Your trading style</h2>
            <p className="text-muted-foreground">
              This helps us personalise your experience.
            </p>
          </div>

          <div className="space-y-3">
            {TRADING_STYLES.map(style => (
              <button
                key={style.value}
                onClick={() => {
                  if (VALID_STYLES.includes(style.value)) {
                    update('tradingStyle', style.value as TradingStyleValue)
                  }
                }}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all',
                  values.tradingStyle === style.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-card hover:bg-muted/30'
                )}
              >
                <span className="text-2xl">{style.icon}</span>
                <div>
                  <p className="font-medium">{style.label}</p>
                  <p className="text-sm text-muted-foreground">{style.desc}</p>
                </div>
                {values.tradingStyle === style.value && (
                  <div className="ml-auto w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label>Primary Markets</Label>
            <div className="flex flex-wrap gap-2">
              {MARKETS.map(market => (
                <button
                  key={market}
                  onClick={() => toggleMarket(market)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm border transition-all',
                    values.primaryMarkets?.includes(market)
                      ? 'border-primary bg-primary/10 text-primary font-medium'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  {market}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 4 — Ready */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold">You're all set! 🎉</h2>
            <p className="text-muted-foreground">Here's what you can do next:</p>
          </div>

          <div className="space-y-3">
            {[
              {
                icon: TrendingUp,
                color: 'text-emerald-500',
                bg: 'bg-emerald-500/10',
                title: 'Import your trades',
                desc: 'Upload a CSV from your broker to import all your historical trades at once.',
              },
              {
                icon: Target,
                color: 'text-blue-500',
                bg: 'bg-blue-500/10',
                title: 'Add a trade manually',
                desc: 'Log your first trade to see how the analytics work.',
              },
              {
                icon: BookOpen,
                color: 'text-purple-500',
                bg: 'bg-purple-500/10',
                title: 'Write a journal entry',
                desc: 'Start tracking your daily trading psychology.',
              },
            ].map(item => (
              <div
                key={item.title}
                className="flex items-start gap-3 bg-card border border-border rounded-xl p-4"
              >
                <div className={`w-10 h-10 ${item.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-8">
        <div>
          {step > 1 ? (
            <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={saving}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          ) : (
            <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
              Skip setup
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{step} / {TOTAL_STEPS}</span>
          {step < TOTAL_STEPS ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>
              Continue
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={saving}>
              {saving ? 'Setting up...' : 'Go to Dashboard'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}