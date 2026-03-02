//src/app/(dashboard)/playbook/[id]/page.tsx

import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getSetup } from '@/actions/playbook'
import { PageHeader } from '@/components/shared/page-header'
import { SetupDetail } from '@/components/playbook/setup-detail'
import { Button } from '@/components/ui/button'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const setup = await getSetup(id)
  return { title: setup?.name ?? 'Setup' }
}

export default async function SetupPage({ params }: Props) {
  const { id } = await params
  const setup = await getSetup(id)
  if (!setup) notFound()

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link href="/playbook">
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Playbook
        </Link>
      </Button>
      <PageHeader
        title={setup.name}
        description={setup.description ?? 'Trading setup details'}
      />
      <SetupDetail setup={setup as any} />
    </div>
  )
}