//src/app/admin/layout.tsx
// src/app/admin/layout.tsx

import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireRole } from '@/lib/auth/rbac'
import { ArrowLeft } from 'lucide-react'
import { AdminNav } from '@/components/admin/admin-nav'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // FIX: requireRole iz rbac.ts umjesto requireAdmin iz @/lib/admin
  try {
    await requireRole('admin')
  } catch {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              App
            </Link>
            <span className="text-border">|</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">A</span>
              </div>
              <span className="font-semibold">Admin Panel</span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        <AdminNav />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  )
}