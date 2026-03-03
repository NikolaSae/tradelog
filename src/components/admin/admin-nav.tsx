//src/components/admin/admin-nav.tsx

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, CreditCard } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard, exact: true },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/billing', label: 'Billing', icon: CreditCard },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <aside className="w-44 shrink-0">
      <nav className="space-y-1">
        {links.map(link => {
          const isActive = link.exact
            ? pathname === link.href
            : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <link.icon className="h-4 w-4 shrink-0" />
              {link.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}