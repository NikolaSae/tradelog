//src/app/(marketing)/page.tsx

import Link from 'next/link'
import {
  TrendingUp, BarChart2, BookOpen, Target,
  BookMarked, Upload, Shield, Zap, CheckCircle,
  ArrowRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tradelog — Professional Trading Journal',
  description: 'Track, analyze, and improve your trading performance with Tradelog.',
}

// ── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: TrendingUp,
    title: 'Trade Journal',
    description: 'Log every trade with entry, exit, notes, and emotion tags. Build a complete picture of your trading.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    icon: BarChart2,
    title: 'Deep Analytics',
    description: 'P&L by symbol, session, day of week, drawdown curves, and R-distribution charts.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    icon: BookOpen,
    title: 'Daily Journal',
    description: 'Pre and post-session notes, mood tracking, lessons learned. Understand your psychology.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    icon: Target,
    title: 'Goals & Targets',
    description: 'Set monthly P&L, win rate, or profit factor goals. Track progress in real time.',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    icon: BookMarked,
    title: 'Playbook',
    description: 'Document your setups, entry and exit rules. Stay consistent and accountable.',
    color: 'text-pink-500',
    bg: 'bg-pink-500/10',
  },
  {
    icon: Upload,
    title: 'CSV Import',
    description: 'Import directly from cTrader and other brokers. No manual entry required.',
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/10',
  },
]

const stats = [
  { value: '50+', label: 'Performance metrics' },
  { value: '6', label: 'Chart types' },
  { value: '100%', label: 'Private & secure' },
  { value: '∞', label: 'Trades on Pro' },
]

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    description: 'Get started with the basics',
    features: [
      'Up to 50 trades',
      'Manual trade entry',
      'Basic dashboard',
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
    period: 'per month',
    description: 'Everything you need to grow',
    features: [
      'Unlimited trades',
      'CSV/Excel import',
      'Full analytics suite',
      'Calendar heatmap',
      'Goals & targets',
      'Playbook library',
      'Export reports',
      'Email alerts',
    ],
    cta: 'Start Pro',
    href: '/register?plan=pro',
    highlight: true,
    badge: 'Most Popular',
  },
  {
    name: 'Elite',
    price: '$35',
    period: 'per month',
    description: 'For professional traders',
    features: [
      'Everything in Pro',
      'Multi-account management',
      'Prop firm mode',
      'Full API access',
      'Priority support',
    ],
    cta: 'Start Elite',
    href: '/register?plan=elite',
    highlight: false,
  },
]

const testimonials = [
  {
    quote: "Finally a trading journal that doesn't feel like a chore. The analytics showed me I was losing money on Fridays — I stopped trading Fridays, instantly more profitable.",
    author: 'Alex K.',
    role: 'Forex trader, 4 years',
  },
  {
    quote: "The cTrader import saved me hours every week. I focus on improving my trading instead of data entry.",
    author: 'Marko P.',
    role: 'Prop firm trader',
  },
  {
    quote: "The psychology section is underrated. Seeing that 80% of my losses came when I was trading with FOMO was a wake-up call.",
    author: 'Sarah T.',
    role: 'Futures trader',
  },
]

// ── Components ────────────────────────────────────────────────────────────────

function FeatureCard({ feature }: { feature: typeof features[0] }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:border-border/60 transition-colors">
      <div className={`w-10 h-10 ${feature.bg} rounded-xl flex items-center justify-center mb-4`}>
        <feature.icon className={`h-5 w-5 ${feature.color}`} />
      </div>
      <h3 className="font-semibold mb-2">{feature.title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
    </div>
  )
}

function PricingCard({ plan }: { plan: typeof plans[0] }) {
  return (
    <div className={`relative bg-card border rounded-2xl p-6 flex flex-col ${
      plan.highlight
        ? 'border-primary shadow-lg shadow-primary/10'
        : 'border-border'
    }`}>
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
        <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
      </div>

      <ul className="space-y-2.5 flex-1 mb-6">
        {plan.features.map(f => (
          <li key={f} className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        variant={plan.highlight ? 'default' : 'outline'}
        className="w-full"
      >
        <Link href={plan.href}>{plan.cta}</Link>
      </Button>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="overflow-x-hidden">

      {/* Hero */}
      <section className="relative py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center relative">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary border border-primary/20 text-xs font-medium px-3 py-1.5 rounded-full mb-6">
            <Zap className="h-3 w-3" />
            Built for serious traders
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
            Stop guessing.
            <span className="text-primary"> Start knowing</span>
            <br />why you win or lose.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            Tradelog is a professional trading journal that turns your raw trade data into actionable insights.
            Know your best sessions, worst habits, and exactly what to fix.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/register">
                Start for Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/#features">See Features</Link>
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4">
            Free forever · No credit card required · Up to 50 trades
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-border/40 bg-muted/20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to level up
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              From trade logging to deep psychology analytics — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map(f => <FeatureCard key={f.title} feature={f} />)}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-muted/20 border-y border-border/40">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Get started in minutes</h2>
            <p className="text-muted-foreground">Three steps to better trading</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Import or log trades',
                desc: 'Connect your broker via CSV export or add trades manually. cTrader, MT4, MT5 supported.',
              },
              {
                step: '02',
                title: 'Analyse your patterns',
                desc: 'See your best symbols, sessions, and days. Spot emotional trading, overtrading, and bad habits.',
              },
              {
                step: '03',
                title: 'Improve consistently',
                desc: 'Set goals, write daily reflections, document your setups. Build discipline over time.',
              },
            ].map(item => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <span className="text-primary font-bold">{item.step}</span>
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold mb-4">Traders love Tradelog</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(t => (
              <div key={t.author} className="bg-card border border-border rounded-xl p-6">
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                  "{t.quote}"
                </p>
                <Separator className="mb-4" />
                <div>
                  <p className="font-semibold text-sm">{t.author}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24 bg-muted/20 border-y border-border/40">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, transparent pricing</h2>
            <p className="text-muted-foreground text-lg">Start free. Upgrade when you're ready.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => <PricingCard key={plan.name} plan={plan} />)}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-8">
            All plans include a 14-day free trial of Pro features. No credit card required.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="bg-card border border-border rounded-2xl p-10 md:p-14">
            <Shield className="h-10 w-10 text-primary mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Start trading smarter today
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Join traders who use Tradelog to understand their performance and grow their edge.
            </p>
            <Button size="lg" asChild>
              <Link href="/register">
                Create Free Account
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-muted-foreground mt-4">
              Free forever · No credit card · Cancel anytime
            </p>
          </div>
        </div>
      </section>

    </div>
  )
}