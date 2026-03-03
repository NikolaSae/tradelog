//// src/app/api/webhooks/stripe/route.ts
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
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break

        const userId = session.metadata?.userId
        const plan = session.metadata?.plan
        if (!userId || !plan) break

        const subscription = await stripe.subscriptions.retrieve(
          session.subscription as string
        )

        await handleSubscriptionUpsert(userId, subscription, plan as 'PRO' | 'ELITE')
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        if (!userId) break

        const priceId = subscription.items.data[0]?.price.id
        const plan = priceId ? getPlanFromPriceId(priceId) : null
        if (!plan) break

        await handleSubscriptionUpsert(userId, subscription, plan)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        if (!userId) break

        // Downgrade na FREE
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
  if (!user) break

  await db.update(subscriptions)
    .set({ status: 'PAST_DUE', updatedAt: new Date() })
    .where(eq(subscriptions.userId, user.id))

  // Pošalji email
  await sendPaymentFailedEmail(user.email, user.name ?? undefined)
  break
}
    }

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
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

  // Ažuriraj plan na user tabeli
  await db.update(users)
    .set({ plan: plan as any, updatedAt: new Date() })
    .where(eq(users.id, userId))
}