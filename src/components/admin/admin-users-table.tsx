//src/components/admin/admin-users-table.tsx
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import { adminSetUserPlan } from '@/actions/admin'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface AdminUser {
  id: string
  name: string | null
  email: string
  plan: string
  createdAt: Date
  stripeCustomerId: string | null
}

interface AdminUsersTableProps {
  users: AdminUser[]
  total: number
  page: number
  totalPages: number
  currentPlan: string
  currentSearch: string
}

const PLAN_COLORS: Record<string, string> = {
  FREE: 'text-muted-foreground bg-muted border-border',
  PRO: 'text-primary bg-primary/10 border-primary/20',
  ELITE: 'text-purple-500 bg-purple-500/10 border-purple-500/20',
}

const PLANS = ['all', 'FREE', 'PRO', 'ELITE']

export function AdminUsersTable({
  users, total, page, totalPages, currentPlan, currentSearch,
}: AdminUsersTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch)
  const [changingPlan, setChangingPlan] = useState<string | null>(null)

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === 'all') params.delete(key)
    else params.set(key, value)
    params.delete('page')
    router.push(`${pathname}?${params.toString()}`)
  }

  function goToPage(p: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('page', p.toString())
    router.push(`${pathname}?${params.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setParam('search', search || null)
  }

  async function handlePlanChange(userId: string, plan: 'FREE' | 'PRO' | 'ELITE') {
    setChangingPlan(userId)
    const result = await adminSetUserPlan(userId, plan)
    if (result.success) {
      toast.success(`Plan updated to ${plan}`)
      router.refresh()
    } else {
      toast.error('Failed to update plan')
    }
    setChangingPlan(null)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search email or name..."
              className="pl-8 h-8 w-56 text-sm"
            />
          </div>
          <Button type="submit" size="sm" variant="outline" className="h-8">
            Search
          </Button>
        </form>

        {/* Plan filter */}
        <div className="flex items-center gap-1.5">
          {PLANS.map(p => (
            <button
              key={p}
              onClick={() => setParam('plan', p)}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-medium border transition-colors capitalize',
                currentPlan === p
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border hover:bg-muted/50'
              )}
            >
              {p === 'all' ? 'All plans' : p}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Joined</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Stripe</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                  No users found
                </td>
              </tr>
            ) : users.map(user => (
              <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{user.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'text-xs font-semibold px-2 py-0.5 rounded-full border',
                    PLAN_COLORS[user.plan] ?? PLAN_COLORS.FREE
                  )}>
                    {user.plan}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                  {new Date(user.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {user.stripeCustomerId ? (
                    <a
                      href={`https://dashboard.stripe.com/customers/${user.stripeCustomerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline font-mono"
                    >
                      {user.stripeCustomerId.slice(0, 14)}...
                    </a>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <select
                    value={user.plan}
                    onChange={e => handlePlanChange(user.id, e.target.value as any)}
                    disabled={changingPlan === user.id}
                    className="text-xs h-7 px-2 rounded-md border border-input bg-background disabled:opacity-50"
                  >
                    <option value="FREE">FREE</option>
                    <option value="PRO">PRO</option>
                    <option value="ELITE">ELITE</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            Page {page} of {totalPages} · {total} users
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="icon" className="h-7 w-7"
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="outline" size="icon" className="h-7 w-7"
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}