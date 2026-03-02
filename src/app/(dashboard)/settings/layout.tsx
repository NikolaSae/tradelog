//src/app/(dashboard)/settings/layout.tsx

import Link from 'next/link'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

const settingsTabs = [
  { label: 'Profile', href: '/settings/profile' },
  { label: 'Accounts', href: '/settings/accounts' },
  { label: 'Subscription', href: '/settings/subscription' },
  { label: 'Security', href: '/settings/security' },
  { label: 'Notifications', href: '/settings/notifications' },
]

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar nav */}
        <nav className="md:w-48 shrink-0">
          <ul className="space-y-1">
            {settingsTabs.map((tab) => (
              <li key={tab.href}>
                <Link
                  href={tab.href}
                  className={cn(
                    'block px-3 py-2 rounded-lg text-sm transition-colors',
                    'hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  )
}