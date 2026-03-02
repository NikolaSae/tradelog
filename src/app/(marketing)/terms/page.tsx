//src/app/(marketing)/terms/page.tsx


import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of Service' }

export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground text-sm">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      {[
        {
          title: 'Acceptance',
          body: 'By using Tradelog you agree to these terms. If you do not agree, please do not use the service.',
        },
        {
          title: 'Service',
          body: 'Tradelog provides a trading journal and analytics platform. We do not provide financial advice. Past performance data shown in the app is for informational purposes only and does not constitute investment advice.',
        },
        {
          title: 'Account',
          body: 'You are responsible for maintaining the security of your account credentials. You must be at least 18 years old to use this service.',
        },
        {
          title: 'Acceptable use',
          body: 'You agree not to use the service for any unlawful purpose. You agree not to attempt to reverse-engineer, hack, or disrupt the service.',
        },
        {
          title: 'Payments',
          body: 'Paid plans are billed monthly or annually. Payments are processed by Stripe. We do not store your payment details. Refunds are available within 7 days of payment if requested.',
        },
        {
          title: 'Termination',
          body: 'We may suspend or terminate accounts that violate these terms. You may cancel your account at any time from Settings.',
        },
        {
          title: 'Liability',
          body: 'Tradelog is provided "as is". We are not liable for any trading losses or decisions made based on data shown in the app.',
        },
        {
          title: 'Contact',
          body: 'For terms questions, contact us at hello@tradelog.app.',
        },
      ].map(section => (
        <div key={section.title}>
          <h2 className="font-semibold mb-2">{section.title}</h2>
          <p className="text-muted-foreground text-sm leading-relaxed">{section.body}</p>
        </div>
      ))}
    </div>
  )
}