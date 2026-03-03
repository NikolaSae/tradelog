//src/app/(dashboard)/error.tsx

'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Dashboard error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-5 max-w-sm">
        <div className="w-14 h-14 bg-red-500/10 rounded-xl flex items-center justify-center mx-auto">
          <AlertTriangle className="h-7 w-7 text-red-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            This page failed to load. Try again or navigate to a different section.
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={reset} size="sm">Try Again</Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}