//src/app/(dashboard)/playbook/new/page.tsx

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { SetupForm } from '@/components/playbook/setup-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'New Setup' }

export default function NewSetupPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/playbook">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Playbook
        </Link>
      </Button>
      <PageHeader title="New Setup" description="Document a trading strategy or pattern" />
      <div className="bg-card border border-border rounded-xl p-6">
        <SetupForm />
      </div>
    </div>
  )
}