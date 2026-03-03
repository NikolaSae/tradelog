//src/config/plans.ts

export const PLANS = {
  FREE: {
    name: 'Free',
    maxTrades: 50,
    price: { monthly: 0, yearly: 0 },
    features: [
      'Up to 50 trades',
      'Manual trade entry',
      'Basic dashboard',
      'Monthly overview',
    ],
  },
  PRO: {
    name: 'Pro',
    maxTrades: Infinity,
    price: { monthly: 15, yearly: 120 },
    features: [
      'Unlimited trades',
      'CSV/Excel import',
      'Full analytics suite',
      'Calendar heatmap',
      'Goals & targets',
      'Playbook library',
      'Export reports',
      'Email alerts',
      'AI insights',
    ],
  },
  ELITE: {
    name: 'Elite',
    maxTrades: Infinity,
    price: { monthly: 35, yearly: 280 },
    features: [
      'Everything in Pro',
      'Multi-account management',
      'Prop firm / mentor mode',
      'Team analytics',
      'Full API access',
      'Priority support',
    ],
  },
} as const

export type PlanType = keyof typeof PLANS

export const FEATURE_GATES = {
  UNLIMITED_TRADES:    ['PRO', 'ELITE'],
  CSV_IMPORT:          ['PRO', 'ELITE'],
  ADVANCED_ANALYTICS:  ['PRO', 'ELITE'],
  ANALYTICS:           ['PRO', 'ELITE'],
  CALENDAR_HEATMAP:    ['PRO', 'ELITE'],
  MAE_MFE_ANALYSIS:    ['PRO', 'ELITE'],
  EXPORT:              ['PRO', 'ELITE'],
  GOALS_SYSTEM:        ['PRO', 'ELITE'],
  PLAYBOOK:            ['PRO', 'ELITE'],
  ALERTS:              ['PRO', 'ELITE'],
  AI_INSIGHTS:         ['PRO', 'ELITE'],
  PSYCHOLOGY_TRACKING: ['PRO', 'ELITE'],
  API_ACCESS:          ['PRO', 'ELITE'],
  MULTI_ACCOUNT:       ['ELITE'],
  PROP_FIRM_MODE:      ['ELITE'],
} as const

export type FeatureGate = keyof typeof FEATURE_GATES

export function hasFeatureAccess(
  userPlan: PlanType,
  feature: FeatureGate
): boolean {
  return (FEATURE_GATES[feature] as readonly string[]).includes(userPlan)
}