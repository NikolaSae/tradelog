//src/app/(marketing)/privacy/page.tsx
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy Policy' }

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm">Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
      </div>

      {[
        {
          title: 'What we collect',
          body: 'We collect your email address and name for account creation. We store trade data, journal entries, and analytics that you create within the app. We do not sell your data to third parties.',
        },
        {
          title: 'How we use your data',
          body: 'Your data is used solely to provide the Tradelog service. Trade data is used to calculate analytics and performance metrics shown to you. We do not use your trading data for any other purpose.',
        },
        {
          title: 'Data storage',
          body: 'All data is stored securely in encrypted databases. We use industry-standard security practices including HTTPS encryption for all data in transit.',
        },
        {
          title: 'Data deletion',
          body: 'You can delete your account and all associated data at any time from Settings → Data. Data deletion is permanent and irreversible.',
        },
        {
          title: 'Cookies',
          body: 'We use session cookies for authentication only. We do not use tracking or advertising cookies.',
        },
        {
          title: 'Contact',
          body: 'For privacy questions, contact us at privacy@tradelog.app.',
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