//src/app/(marketing)/pricing/page.tsx


import Link from 'next/link'
import { CheckCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for every trader.',
}

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Up to 50 trades',
      'Manual trade entry',
      'Basic dashboard & KPIs',
      'Daily journal',
      'Monthly overview',
    ],
    cta: 'Get Started Free',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$15',
    yearlyPrice: '$120',
    period: 'per month',
    features: [
      'Unlimited trades',
      'CSV / Excel import',
      'Full analytics suite',
      'Calendar heatmap',
      'Goals & targets',
      'Playbook library',
      'Export reports',
      'Email alerts',
    ],
    cta: 'Start Pro — $15/mo',
    href: '/register?plan=pro',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Elite',
    price: '$35',
    yearlyPrice: '$280',
    period: 'per month',
    features: [
      'Everything in Pro',
      'Multi-account management',
      'Prop firm / mentor mode',
      'Full API access',
      'Priority support',
    ],
    cta: 'Start Elite — $35/mo',
    href: '/register?plan=elite',
    highlight: false,
  },
]

const faqs = [
  {
    q: 'Can I switch plans later?',
    a: 'Yes, you can upgrade or downgrade at any time. Upgrades take effect immediately, downgrades at the end of the billing period.',
  },
  {
    q: 'Is there a free trial for Pro?',
    a: 'Yes — all new accounts get a 14-day Pro trial automatically. No credit card required.',
  },
  {
    q: 'What happens to my data if I downgrade?',
    a: 'Your data is always safe. If you downgrade to Free and have more than 50 trades, they are still stored — you just can\'t add new ones until you\'re under the limit.',
  },
  {
    q: 'Which brokers are supported for import?',
    a: 'cTrader CSV export is natively supported. Generic CSV with standard columns (symbol, direction, entry/exit price, lots) works for most other brokers.',
  },
]

export default function PricingPage() {
  return (
    <div className="py-16 space-y-20">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold mb-4">Simple, transparent pricing</h1>
          <p className="text-muted-foreground text-lg">
            Start free. Upgrade when you need more power.
          </p>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div
              key={plan.name}
              className={`relative bg-card border rounded-2xl p-6 flex flex-col ${
                plan.highlight ? 'border-primary shadow-lg shadow-primary/10' : 'border-border'
              }`}
            >
              {plan.highlight && (plan as any).badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    {(plan as any).badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-bold text-lg">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">/{plan.period}</span>
                </div>
                {(plan as any).yearlyPrice && (
                  <p className="text-xs text-muted-foreground mt-1">
                    or {(plan as any).yearlyPrice}/year (save 33%)
                  </p>
                )}
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button asChild variant={plan.highlight ? 'default' : 'outline'} className="w-full">
                <Link href={plan.href}>
                  {plan.cta}
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqs.map(faq => (
            <div key={faq.q} className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold mb-2">{faq.q}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}