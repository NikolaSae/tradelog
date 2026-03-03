//src/app/admin/users/page.tsx
import { getAdminUsers } from '@/actions/admin'
import { AdminUsersTable } from '@/components/admin/admin-users-table'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Users' }

interface PageProps {
  searchParams: Promise<{
    page?: string
    plan?: string
    search?: string
  }>
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const params = await searchParams
  const page = Math.max(1, Number(params.page ?? 1))
  const plan = params.plan ?? 'all'
  const search = params.search ?? ''

  const data = await getAdminUsers({ page, limit: 25, plan, search })

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Users</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {data.total.toLocaleString()} total users
        </p>
      </div>

      <AdminUsersTable
        users={data.users as any}
        total={data.total}
        page={data.page}
        totalPages={data.totalPages}
        currentPlan={plan}
        currentSearch={search}
      />
    </div>
  )
}