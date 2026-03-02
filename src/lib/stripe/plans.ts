//src/lib/stripe/plans.ts

export const STRIPE_PLANS = {
  PRO: {
    monthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID!,
  },
  ELITE: {
    monthly: process.env.STRIPE_ELITE_MONTHLY_PRICE_ID!,
    yearly: process.env.STRIPE_ELITE_YEARLY_PRICE_ID!,
  },
} as const

export type BillingInterval = 'monthly' | 'yearly'
export type UpgradePlan = 'PRO' | 'ELITE'

// Mapiranje Stripe Price ID → naš plan
export function getPlanFromPriceId(priceId: string): 'PRO' | 'ELITE' | null {
  if (
    priceId === STRIPE_PLANS.PRO.monthly ||
    priceId === STRIPE_PLANS.PRO.yearly
  ) return 'PRO'

  if (
    priceId === STRIPE_PLANS.ELITE.monthly ||
    priceId === STRIPE_PLANS.ELITE.yearly
  ) return 'ELITE'

  return null
}