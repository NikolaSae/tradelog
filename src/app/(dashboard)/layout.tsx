//src/app/(dashboard)/layout.tsx

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppHeader } from '@/components/layout/app-header'
import { SidebarProvider } from '@/components/ui/sidebar'
import { checkOnboardingStatus } from '@/actions/onboarding'

// U dashboard layout serveru:
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  // Provjeri onboarding samo za nove korisnike
  const status = await checkOnboardingStatus()
  if (!status.completed) {
    redirect('/onboarding')
  }

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <div className="flex flex-col flex-1 min-w-0">
        <AppHeader user={session.user} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}