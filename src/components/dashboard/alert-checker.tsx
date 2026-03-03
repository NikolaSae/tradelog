//src/components/dashboard/alert-checker.tsx

'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

interface AlertCheckerProps {
  triggered: { type: string; message: string }[]
}

export function AlertChecker({ triggered }: AlertCheckerProps) {
  useEffect(() => {
    triggered.forEach(alert => {
      toast.warning(alert.message, {
        duration: 8000,
        icon: alert.type === 'DAILY_LOSS_LIMIT' ? '🛑'
          : alert.type === 'LOSING_STREAK' ? '🔴'
          : alert.type === 'OVERTRADING' ? '⚡'
          : '📉',
      })
    })
  }, [])

  return null
}