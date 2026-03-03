//src/components/settings/profile-form.tsx

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { updateProfile } from '@/actions/profile'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { User } from '@/lib/auth'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  timezone: z.string().optional(),
  currency: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Belgrade',
  'Europe/Berlin', 'Europe/Paris', 'Asia/Tokyo',
  'Asia/Singapore', 'Asia/Dubai', 'Australia/Sydney',
]

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF']

interface ProfileFormProps {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  const [nickname, setNickname] = useState((user as any).nickname ?? '')
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(
    (user as any).showOnLeaderboard ?? true
  )

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: user.name ?? '',
      timezone: (user as any).timezone ?? 'UTC',
      currency: (user as any).currency ?? 'USD',
    },
  })

  async function onSubmit(values: FormValues) {
    const result = await updateProfile({
      ...values,
      nickname,
      showOnLeaderboard,
    })
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Profile updated')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md">
      {/* Name & Nickname */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" placeholder="Your name" {...register('name')} />
          {errors.name && (
            <p className="text-destructive text-sm">{errors.name.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            Nickname{' '}
            <span className="text-muted-foreground text-xs">(shown on leaderboard)</span>
          </Label>
          <Input
            value={nickname}
            onChange={e => setNickname(e.target.value)}
            placeholder="e.g. TradingKing, FX_Wolf"
            maxLength={50}
          />
          <p className="text-xs text-muted-foreground">
            If empty, a nickname is auto-generated from your name.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user.email}
            disabled
            className="opacity-60"
          />
          <p className="text-xs text-muted-foreground">Email cannot be changed</p>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h3 className="font-medium text-sm">Preferences</h3>

        <div className="space-y-2">
          <Label>Timezone</Label>
          <Select
            value={watch('timezone')}
            onValueChange={v => setValue('timezone', v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map(tz => (
                <SelectItem key={tz} value={tz}>{tz}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Default Currency</Label>
          <Select
            value={watch('currency')}
            onValueChange={v => setValue('currency', v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Leaderboard toggle */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div>
            <p className="text-sm font-medium">Show on Leaderboard</p>
            <p className="text-xs text-muted-foreground">
              Others can see your stats (email is always masked)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowOnLeaderboard(!showOnLeaderboard)}
            className={cn(
              'relative w-11 h-6 rounded-full transition-colors shrink-0',
              showOnLeaderboard ? 'bg-primary' : 'bg-muted'
            )}
          >
            <span className={cn(
              'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
              showOnLeaderboard ? 'translate-x-6' : 'translate-x-1'
            )} />
          </button>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Saving...' : 'Save Changes'}
      </Button>
    </form>
  )
}