// src/actions/subscriptions.ts
'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '@/db'
import { subscriptions, users } from '@/db/schema'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { STRIPE_PLANS } from '@/lib/stripe/plans'
import type { BillingInterval, UpgradePlan } from '@/lib/stripe/plans'

const VALID_PLANS = ['PRO', 'ELITE'] as const
const VALID_INTERVALS = ['monthly', 'yearly'] as const

const checkoutSchema = z.object({
  plan: z.enum(VALID_PLANS),
  interval: z.enum(VALID_INTERVALS),
})

async function getSession() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error('Unauthorized')
  return session
}

async function getOrCreateStripeCustomer(userId: string, email: string, name?: string | null) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })
  if (user?.stripeCustomerId) return user.stripeCustomerId

  const customer = await stripe.customers.create({
    email,
    name: name ?? undefined,
    metadata: { userId },
  })

  await db.update(users)
    .set({ stripeCustomerId: customer.id, updatedAt: new Date() })
    .where(eq(users.id, userId))

  return customer.id
}

export async function createCheckoutSession(
  plan: UpgradePlan,
  interval: BillingInterval
) {
  const session = await getSession()

  // Runtime validacija — TypeScript tipovi ne postoje u runtime
  const parsed = checkoutSchema.safeParse({ plan, interval })
  if (!parsed.success) throw new Error('Invalid plan or interval')

  const userId = session.user.id
  const userEmail = session.user.email
  const userName = session.user.name

  const priceId = STRIPE_PLANS[parsed.data.plan][parsed.data.interval]
  if (!priceId) throw new Error('Invalid plan or interval')

  const customerId = await getOrCreateStripeCustomer(userId, userEmail, userName)

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${appUrl}/upgrade/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/upgrade`,
    metadata: { userId, plan: parsed.data.plan, interval: parsed.data.interval },
    subscription_data: {
      metadata: { userId, plan: parsed.data.plan },
    },
    allow_promotion_codes: true,
  })

  if (!checkoutSession.url) throw new Error('Failed to create checkout session')
  redirect(checkoutSession.url)
}

export async function createPortalSession() {
  const session = await getSession()
  const userId = session.user.id

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (!user?.stripeCustomerId) throw new Error('No Stripe customer found')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/settings/subscription`,
  })

  redirect(portalSession.url)
}

export async function getSubscription() {
  const session = await getSession()
  return db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, session.user.id),
  })
}

export async function getBillingHistory() {
  const session = await getSession()
  const userId = session.user.id

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (!user?.stripeCustomerId) return []

  const invoices = await stripe.invoices.list({
    customer: user.stripeCustomerId,
    limit: 24,
  })

  return invoices.data.map(inv => ({
    id: inv.id,
    amount: inv.amount_paid / 100,
    currency: inv.currency.toUpperCase(),
    status: inv.status,
    date: new Date(inv.created * 1000),
    // Validacija — samo Stripe URL-ovi
    invoiceUrl: isStripeUrl(inv.hosted_invoice_url) ? inv.hosted_invoice_url : null,
  }))
}

function isStripeUrl(url: string | null | undefined): boolean {
  if (!url) return false
  try {
    const parsed = new URL(url)
    return parsed.hostname === 'invoice.stripe.com' ||
           parsed.hostname === 'billing.stripe.com' ||
           parsed.hostname.endsWith('.stripe.com')
  } catch {
    return false
  }
}