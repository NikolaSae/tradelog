//src/components/layout/app-header.tsx

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { ThemeToggle } from '@/components/theme-toggle'
import type { User } from '@/lib/auth'

interface AppHeaderProps {
  user: User
}

export function AppHeader({ user }: AppHeaderProps) {
  const plan = (user as any).plan ?? 'FREE'

  return (
    <header className="flex h-14 items-center gap-4 border-b border-border px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="h-4" />
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        {plan === 'FREE' && (
          <a href="/upgrade">
            <Badge variant="outline" className="border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer text-xs">
              Upgrade to Pro
            </Badge>
          </a>
        )}
        {plan === 'PRO' && (
          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">
            Pro
          </Badge>
        )}
        {plan === 'ELITE' && (
          <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs">
            Elite
          </Badge>
        )}
        <ThemeToggle />
      </div>
    </header>
  )
}