//src/app/admin/billing/page.tsx
import { getAdminBilling } from '@/actions/admin'
import { formatCurrency } from '@/lib/utils'
import { ExternalLink } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Admin — Billing' }

export default async function AdminBillingPage() {
  const billing = await getAdminBilling(50)

  const totalRevenue = billing
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + b.amount, 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Recent payments · Total shown: {formatCurrency(totalRevenue)}
          </p>
        </div>
        <a
          href="https://dashboard.stripe.com/payments"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Open Stripe
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Date</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">Invoice</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {billing.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                  No billing history yet
                </td>
              </tr>
            ) : billing.map(b => (
              <tr key={b.id} className="hover:bg-muted/20 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-sm">{b.user?.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{b.user?.email ?? 'Unknown'}</p>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold">
                  {formatCurrency(b.amount, b.currency.toUpperCase())}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                    b.status === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                  }`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                  {new Date(b.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </td>
                <td className="px-4 py-3 text-right">
                  {b.invoiceUrl ? (
                    <a
                      href={b.invoiceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}