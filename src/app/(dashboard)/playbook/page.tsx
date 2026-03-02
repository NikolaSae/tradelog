//src/app/(dashboard)/playbook/page.tsx
import Link from 'next/link'
import { Plus, BookMarked } from 'lucide-react'
import { getSetups } from '@/actions/playbook'
import { PageHeader } from '@/components/shared/page-header'
import { UpgradeGate } from '@/components/shared/upgrade-gate'
import { EmptyState } from '@/components/shared/empty-state'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Playbook' }

export default async function PlaybookPage() {
  const setups = await getSetups()

  return (
    <div className="space-y-6">
      <PageHeader title="Playbook" description="Your trading strategies and setups">
        <UpgradeGate feature="PLAYBOOK" blur={false} fallback={
          <Button variant="outline" asChild>
            <Link href="/upgrade">Upgrade to Add Setups</Link>
          </Button>
        }>
          <Button asChild>
            <Link href="/playbook/new">
              <Plus className="h-4 w-4 mr-2" />
              New Setup
            </Link>
          </Button>
        </UpgradeGate>
      </PageHeader>

      <UpgradeGate feature="PLAYBOOK">
        {setups.length === 0 ? (
          <EmptyState
            icon={BookMarked}
            title="No setups yet"
            description="Document your trading strategies to stay consistent and improve over time."
            action={{ label: 'Create your first setup', href: '/playbook/new' }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {setups.map((setup) => (
              <Link key={setup.id} href={`/playbook/${setup.id}`}>
                <div className="bg-card border border-border rounded-xl p-6 hover:border-border/60 hover:shadow-sm transition-all h-full group">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">
                      {setup.name}
                    </h3>
                    {setup.isActive && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0 ml-2">
                        Active
                      </span>
                    )}
                  </div>
                  {setup.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {setup.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {setup.timeframe && <span>⏱ {setup.timeframe}</span>}
                    {setup.markets && <span className="truncate">📊 {setup.markets}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </UpgradeGate>
    </div>
  )
}