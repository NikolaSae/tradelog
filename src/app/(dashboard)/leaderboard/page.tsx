//src/app/(dashboard)/leaderboard/page.tsx


import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getLeaderboard } from '@/actions/leaderboard'
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table'
import { PageHeader } from '@/components/shared/page-header'
import type { Metadata } from 'next'
import type { LeaderboardSortKey, LeaderboardSortDir } from '@/actions/leaderboard'

export const metadata: Metadata = { title: 'Leaderboard' }

interface PageProps {
  searchParams: Promise<{
    sort?: string
    dir?: string
  }>
}

export default async function LeaderboardPage({ searchParams }: PageProps) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) redirect('/login')

  const params = await searchParams
  const sort = (params.sort ?? 'equity') as LeaderboardSortKey
  const dir  = (params.dir  ?? 'desc')  as LeaderboardSortDir

  const entries = await getLeaderboard(sort, dir)

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaderboard"
        description={`${entries.length} traders ranked by performance`}
      />
      <LeaderboardTable
        entries={entries}
        currentUserId={session.user.id}
        sortBy={sort}
        sortDir={dir}
      />
    </div>
  )
}