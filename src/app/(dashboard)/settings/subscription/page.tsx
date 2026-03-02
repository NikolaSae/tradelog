// src/app/(dashboard)/settings/subscription/page.tsx
import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { getSubscription, getBillingHistory } from '@/actions/subscriptions'
import { PageHeader } from '@/components/shared/page-header'
import { SubscriptionPanel } from '@/components/settings/subscription-panel'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Subscription' }

export default async function SubscriptionPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const [subscription, billing] = await Promise.all([
    getSubscription(),
    getBillingHistory(),
  ])

  const plan = (session.user as any).plan ?? 'FREE'

  return (
    <div className="max-w-2xl space-y-6">
      <PageHeader title="Subscription" description="Manage your plan and billing" />
      <SubscriptionPanel
        plan={plan}
        subscription={subscription as any}
        billing={billing}
      />
    </div>
  )
}