//src/app/(dashboard)/settings/profile/page.tsx

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { ProfileForm } from '@/components/settings/profile-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Profile Settings' }

export default async function ProfileSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Profile</h2>
        <p className="text-muted-foreground text-sm mt-1">Update your personal information</p>
      </div>
      <ProfileForm user={session.user} />
    </div>
  )
}