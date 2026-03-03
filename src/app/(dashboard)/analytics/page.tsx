// src/app/(dashboard)/analytics/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { FileBarChart } from 'lucide-react'
import { headers } from 'next/headers'
import { BarChart2, TrendingUp, Brain, Shield } from 'lucide-react'
import { auth } from '@/lib/auth'
import { UpgradeGate } from '@/components/shared/upgrade-gate'
import { PageHeader } from '@/components/shared/page-header'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Analytics' }

const sections = [
  {
    href: '/analytics/performance',
    icon: TrendingUp,
    title: 'Performance',
    description: 'P&L by symbol, session, day of week, and direction breakdown.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-500/10',
  },
  {
    href: '/analytics/risk',
    icon: Shield,
    title: 'Risk',
    description: 'Drawdown, R-distribution, win/loss streaks, duration analysis.',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
  {
    href: '/analytics/psychology',
    icon: Brain,
    title: 'Psychology',
    description: 'Performance breakdown by emotion tag and mental state.',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
]

export default async function AnalyticsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Deep-dive into your trading performance"
      />
<Link
  href="/analytics/report"
  className="flex items-center gap-3 bg-card border border-border rounded-xl p-5 hover:border-primary/40 transition-colors group"
>
  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
    <FileBarChart className="h-5 w-5 text-primary" />
  </div>
  <div>
    <p className="font-semibold">Performance Report</p>
    <p className="text-sm text-muted-foreground">
      Full statistical breakdown — P&L, Sharpe, Sortino, CAGR, drawdowns
    </p>
  </div>
  <span className="ml-auto text-muted-foreground group-hover:text-foreground transition-colors">→</span>
</Link>
      <UpgradeGate feature="ADVANCED_ANALYTICS">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sections.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="bg-card border border-border rounded-xl p-6 hover:border-border/60 hover:shadow-sm transition-all group"
            >
              <div className={`w-10 h-10 ${section.bg} rounded-xl flex items-center justify-center mb-4`}>
                <section.icon className={`h-5 w-5 ${section.color}`} />
              </div>
              <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                {section.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {section.description}
              </p>
            </Link>
          ))}
        </div>
      </UpgradeGate>
    </div>
  )
}