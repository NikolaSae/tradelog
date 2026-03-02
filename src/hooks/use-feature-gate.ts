//src/hooks/use-feature-gate.ts


'use client'

import { useCurrentUser } from './use-current-user'
import type { FeatureGate } from '@/config/plans'

export function useFeatureGate(feature: FeatureGate) {
  const { can, plan, isPending } = useCurrentUser()

  return {
    hasAccess: can(feature),
    plan,
    isPending,
  }
}