//src/app/admin/page.tsx
import { getAdminStats } from '@/actions/admin'
import { formatCurrency } from '@/lib/utils'
import {
  Users, TrendingUp, DollarSign, Activity,
  Crown, Zap, UserCheck,
} from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Overview' }

function StatCard({
  title, value, subtitle, icon: Icon, iconColor, iconBg,
}: {
  title: string
  value: string
  subtitle?: string
  icon: any
  iconColor: string
  iconBg: string
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
        <div className={`w-8 h-8 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  )
}

export default async function AdminPage() {
  const stats = await getAdminStats()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Overview</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Platform health at a glance
        </p>
      </div>

      {/* Revenue */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Revenue
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="MRR"
            value={formatCurrency(stats.mrr)}
            subtitle="This month"
            icon={DollarSign}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-500/10"
          />
          <StatCard
            title="ARR (est.)"
            value={formatCurrency(stats.arr)}
            subtitle="MRR × 12"
            icon={TrendingUp}
            iconColor="text-blue-500"
            iconBg="bg-blue-500/10"
          />
          <StatCard
            title="Last Month"
            value={formatCurrency(stats.lastMonthRevenue)}
            subtitle="Billed revenue"
            icon={Activity}
            iconColor="text-purple-500"
            iconBg="bg-purple-500/10"
          />
        </div>
      </div>

      {/* Users */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Users
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={stats.totalUsers.toLocaleString()}
            subtitle={`+${stats.newUsersThisMonth} this month`}
            icon={Users}
            iconColor="text-foreground"
            iconBg="bg-muted"
          />
          <StatCard
            title="Free"
            value={stats.freeUsers.toLocaleString()}
            subtitle={`${Math.round((stats.freeUsers / stats.totalUsers) * 100) || 0}% of users`}
            icon={UserCheck}
            iconColor="text-muted-foreground"
            iconBg="bg-muted"
          />
          <StatCard
            title="Pro"
            value={stats.proUsers.toLocaleString()}
            subtitle={`${Math.round((stats.proUsers / stats.totalUsers) * 100) || 0}% of users`}
            icon={Zap}
            iconColor="text-primary"
            iconBg="bg-primary/10"
          />
          <StatCard
            title="Elite"
            value={stats.eliteUsers.toLocaleString()}
            subtitle={`${Math.round((stats.eliteUsers / stats.totalUsers) * 100) || 0}% of users`}
            icon={Crown}
            iconColor="text-purple-500"
            iconBg="bg-purple-500/10"
          />
        </div>
      </div>

      {/* Platform */}
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
          Platform
        </h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Active Subscriptions"
            value={stats.activeSubs.toLocaleString()}
            icon={Activity}
            iconColor="text-emerald-500"
            iconBg="bg-emerald-500/10"
          />
          <StatCard
            title="Conversion Rate"
            value={`${stats.conversionRate}%`}
            subtitle="Free → Paid"
            icon={TrendingUp}
            iconColor="text-orange-500"
            iconBg="bg-orange-500/10"
          />
          <StatCard
            title="Total Trades"
            value={stats.totalTrades.toLocaleString()}
            subtitle="Across all accounts"
            icon={Activity}
            iconColor="text-blue-500"
            iconBg="bg-blue-500/10"
          />
        </div>
      </div>
    </div>
  )
}