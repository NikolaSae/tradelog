//// src/app/api/webhooks/stripe/route.ts
// src/app/api/webhooks/stripe/route.ts

import { processedWebhookEvents } from '@/db/schema'
import { env } from '@/config/env'
import { sendPaymentFailedEmail } from '@/lib/email/send'
import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/db'
import { subscriptions, users } from '@/db/schema'
import { stripe } from '@/lib/stripe'
import { getPlanFromPriceId } from '@/lib/stripe/plans'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    // FIX: koristi env objekat umjesto process.env
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      env.STRIPE_WEBHOOK_SECRET
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // FIX: DB idempotency umjesto in-memory Set
  const alreadyProcessed = await db.query.processedWebhookEvents.findFirst({
    where: eq(processedWebhookEvents.id, event.id),
  })

  if (alreadyProcessed) {
    return NextResponse.json({ received: true, skipped: true })
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const customerId = session.customer as string
        const metadataUserId = session.metadata?.userId
        const metadataPlan = session.metadata?.plan

        const userId = await resolveUserId(customerId, metadataUserId)
        if (!userId) {
          console.error('checkout.session.completed: cannot resolve userId', {
            customerId,
            metadataUserId,
          })
          break
        }

        const plan = metadataPlan ?? getPlanFromPriceId(
          (await stripe.subscriptions.retrieve(session.subscription as string))
            .items.data[0]?.price.id ?? ''
        )
        if (!plan) break

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        await db.update(users)
          .set({ stripeCustomerId: customerId, updatedAt: new Date() })
          .where(eq(users.id, userId))

        await handleSubscriptionUpsert(userId, subscription, plan as 'PRO' | 'ELITE')
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const metadataUserId = subscription.metadata?.userId

        const userId = await resolveUserId(customerId, metadataUserId)
        if (!userId) {
          console.error('customer.subscription.updated: cannot resolve userId', {
            customerId,
            metadataUserId,
          })
          break
        }

        const priceId = subscription.items.data[0]?.price.id
        const plan = priceId ? getPlanFromPriceId(priceId) : null
        if (!plan) break

        await handleSubscriptionUpsert(userId, subscription, plan)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const metadataUserId = subscription.metadata?.userId

        const userId = await resolveUserId(customerId, metadataUserId)
        if (!userId) {
          console.error('customer.subscription.deleted: cannot resolve userId', {
            customerId,
            metadataUserId,
          })
          break
        }

        await db.update(users)
          .set({ plan: 'FREE', updatedAt: new Date() })
          .where(eq(users.id, userId))

        await db.update(subscriptions)
          .set({ status: 'CANCELED', updatedAt: new Date() })
          .where(eq(subscriptions.userId, userId))

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const user = await db.query.users.findFirst({
          where: eq(users.stripeCustomerId, customerId),
        })
        if (!user) {
          console.error('invoice.payment_failed: user not found for customer', customerId)
          break
        }

        await db.update(subscriptions)
          .set({ status: 'PAST_DUE', updatedAt: new Date() })
          .where(eq(subscriptions.userId, user.id))

        await sendPaymentFailedEmail(user.email, user.name ?? undefined)
        break
      }
    }

    // FIX: atomic DB insert umjesto in-memory Set
    await db.insert(processedWebhookEvents)
      .values({
        id: event.id,
        type: event.type,
        processedAt: new Date(),
      })
      .onConflictDoNothing()

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

async function resolveUserId(
  customerId: string,
  metadataUserId?: string | null
): Promise<string | null> {
  const userByCustomer = await db.query.users.findFirst({
    where: eq(users.stripeCustomerId, customerId),
  })

  if (userByCustomer) {
    if (metadataUserId && userByCustomer.id !== metadataUserId) {
      console.warn('userId mismatch: stripeCustomerId lookup differs from metadata', {
        fromDb: userByCustomer.id,
        fromMetadata: metadataUserId,
        customerId,
      })
    }
    return userByCustomer.id
  }

  if (metadataUserId) {
    const userByMetadata = await db.query.users.findFirst({
      where: eq(users.id, metadataUserId),
    })
    return userByMetadata?.id ?? null
  }

  return null
}

async function handleSubscriptionUpsert(
  userId: string,
  subscription: Stripe.Subscription,
  plan: 'PRO' | 'ELITE'
) {
  const priceId = subscription.items.data[0]?.price.id ?? ''
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  })

  const subData = {
    userId,
    stripeSubscriptionId: subscription.id,
    stripePriceId: priceId,
    status: subscription.status.toUpperCase() as any,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    trialEnd: subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null,
    updatedAt: new Date(),
  }

  if (existing) {
    await db.update(subscriptions).set(subData).where(eq(subscriptions.userId, userId))
  } else {
    const { nanoid } = await import('nanoid')
    await db.insert(subscriptions).values({
      id: nanoid(),
      ...subData,
      createdAt: new Date(),
    })
  }

  await db.update(users)
    .set({ plan: plan as any, updatedAt: new Date() })
    .where(eq(users.id, userId))
}