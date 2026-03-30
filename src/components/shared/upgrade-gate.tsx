//src/components/shared/upgrade-gate.tsx

// src/components/shared/upgrade-gate.tsx
'use client'

import { Lock } from 'lucide-react'
import { useFeatureGate } from '@/hooks/use-feature-gate'
import type { FeatureGate } from '@/config/plans'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface UpgradeGateProps {
  feature: FeatureGate
  children: React.ReactNode
  fallback?: React.ReactNode
  blur?: boolean
}

export function UpgradeGate({
  feature,
  children,
  fallback,
  blur = true,
}: UpgradeGateProps) {
  const { hasAccess, isPending } = useFeatureGate(feature)

  // Dok se session učitava — prikaži children bez blur-a
  // Ne vraćaj null jer to uzrokuje layout shift i race condition
  if (isPending) return <>{children}</>

  if (hasAccess) return <>{children}</>

  if (fallback) return <>{fallback}</>

  return (
    <div className="relative">
      <div className={cn(blur && 'blur-sm pointer-events-none select-none', 'opacity-50')}>
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-background/95 border border-border rounded-xl p-6 text-center shadow-lg max-w-xs">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <p className="font-semibold text-sm mb-1">Pro Feature</p>
          <p className="text-muted-foreground text-xs mb-4">
            Upgrade to Pro to unlock this feature
          </p>
          <Button size="sm" asChild>
            <a href="/upgrade">Upgrade to Pro</a>
          </Button>
        </div>
      </div>
    </div>
  )
}