//src/config/site.ts

export const siteConfig = {
  name: 'Tradelog',
  description: 'Professional trading journal and analytics platform',
  url: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',

  nav: {
    main: [
      { title: 'Dashboard', href: '/dashboard', icon: 'LayoutDashboard', pro: false },
      { title: 'Trades', href: '/trades', icon: 'TrendingUp', pro: false },
      { title: 'Analytics', href: '/analytics', icon: 'BarChart2', pro: true },
      { title: 'Calendar', href: '/calendar', icon: 'Calendar', pro: true },
      { title: 'Journal', href: '/journal', icon: 'BookOpen', pro: false },
      { title: 'Goals', href: '/goals', icon: 'Target', pro: true },
      { title: 'Playbook', href: '/playbook', icon: 'BookMarked', pro: true },
    ],
    tools: [
      { title: 'Import', href: '/import', icon: 'Upload', pro: true },
      { title: 'Reports', href: '/reports', icon: 'FileText', pro: true },
      { title: 'Alerts', href: '/alerts', icon: 'Bell', pro: true },
    ],
  },
}