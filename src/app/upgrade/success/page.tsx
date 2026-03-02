// src/app/upgrade/success/page.tsx
import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Welcome to Pro!' }

export default function UpgradeSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-8 w-8 text-emerald-500" />
        </div>

        <div>
          <h1 className="text-2xl font-bold mb-2">You're all set! 🎉</h1>
          <p className="text-muted-foreground">
            Your account has been upgraded. All Pro features are now unlocked.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 text-left space-y-2">
          <p className="text-sm font-medium">What's now available:</p>
          {[
            'Unlimited trade logging',
            'CSV import from your broker',
            'Advanced analytics & charts',
            'Goals, Playbook, Calendar',
            'Export to CSV & Excel',
          ].map(f => (
            <p key={f} className="text-sm text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
              {f}
            </p>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <Button asChild size="lg">
            <Link href="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/import">Import Your Trades</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}