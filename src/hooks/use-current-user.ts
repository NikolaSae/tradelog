//src/hooks/use-current-user.ts


'use client'

import { useSession } from '@/lib/auth/client'
import { hasFeatureAccess, type FeatureGate, type PlanType } from '@/config/plans'

export function useCurrentUser() {
  const { data: session, isPending, error } = useSession()

  const user = session?.user ?? null
  const plan = ((user as any)?.plan ?? 'FREE') as PlanType

  function can(feature: FeatureGate): boolean {
    return hasFeatureAccess(plan, feature)
  }

  return {
    user,
    plan,
    can,
    isPending,
    error,
    isAuthenticated: !!user,
  }
}