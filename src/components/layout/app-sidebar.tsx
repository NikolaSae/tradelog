//src/components/layout/app-sidebar.tsx

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, TrendingUp, BarChart2, Calendar,
  BookOpen, Target, BookMarked, Upload, FileText,
  Bell, Settings, Lock,
} from 'lucide-react'
import {
  Sidebar, SidebarContent, SidebarFooter,
  SidebarGroup, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem,
} from '@/components/ui/sidebar'
import { NavUser } from './nav-user'
import { cn } from '@/lib/utils'
import type { User } from '@/lib/auth'
import { Trophy } from 'lucide-react'

const mainNav = [
  { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, pro: false },
  { title: 'Trades', href: '/trades', icon: TrendingUp, pro: false },
  { title: 'Analytics', href: '/analytics', icon: BarChart2, pro: true },
  { title: 'Calendar', href: '/calendar', icon: Calendar, pro: true },
  { title: 'Journal', href: '/journal', icon: BookOpen, pro: false },
  { title: 'Goals', href: '/goals', icon: Target, pro: true },
  { title: 'Playbook', href: '/playbook', icon: BookMarked, pro: true },
  { title: 'Leaderboard', href: '/leaderboard', icon: Trophy, pro: false },
]

const toolsNav = [
  { title: 'Import', href: '/import', icon: Upload, pro: true },
  { title: 'Reports', href: '/reports', icon: FileText, pro: true },
  { title: 'Alerts', href: '/alerts', icon: Bell, pro: true },
]

interface AppSidebarProps {
  user: User
}

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname()
  const isPro = (user as any).plan !== 'FREE'

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shrink-0">
            <span className="text-primary-foreground font-bold text-sm">T</span>
          </div>
          <span className="font-bold text-lg">Tradelog</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {mainNav.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const isLocked = item.pro && !isPro

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link
                      href={isLocked ? '/upgrade' : item.href}
                      className={cn(isLocked && 'opacity-60')}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {isLocked && <Lock className="h-3 w-3 ml-auto" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Tools</SidebarGroupLabel>
          <SidebarMenu>
            {toolsNav.map((item) => {
              const isActive = pathname === item.href
              const isLocked = item.pro && !isPro

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link
                      href={isLocked ? '/upgrade' : item.href}
                      className={cn(isLocked && 'opacity-60')}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                      {isLocked && <Lock className="h-3 w-3 ml-auto" />}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild isActive={pathname.startsWith('/settings')}>
                <Link href="/settings/profile">
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}