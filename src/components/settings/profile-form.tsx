//src/components/settings/profile-form.tsx
'use client'

import { useRef } from 'react'
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
import { useState } from 'react'
import type { User } from '@/lib/auth'

const TIMEZONES = [
  'UTC', 'America/New_York', 'America/Chicago', 'America/Denver',
  'America/Los_Angeles', 'Europe/London', 'Europe/Belgrade',
  'Europe/Berlin', 'Europe/Paris', 'Asia/Tokyo',
  'Asia/Singapore', 'Asia/Dubai', 'Australia/Sydney',
] as const

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF'] as const

type TimezoneValue = typeof TIMEZONES[number]
type CurrencyValue = typeof CURRENCIES[number]

// Whitelist validacija u schema
const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  timezone: z.enum(TIMEZONES).optional(),
  currency: z.enum(CURRENCIES).optional(),
})

type FormValues = z.infer<typeof schema>

interface ProfileFormProps {
  user: User
}

export function ProfileForm({ user }: ProfileFormProps) {
  const submittingRef = useRef(false)
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
      timezone: ((user as any).timezone ?? 'UTC') as TimezoneValue,
      currency: ((user as any).currency ?? 'USD') as CurrencyValue,
    },
  })

  async function onSubmit(values: FormValues) {
    if (submittingRef.current) return
    submittingRef.current = true

    // Client-side validacija nickname-a
    const trimmedNickname = nickname.trim()
    if (trimmedNickname.length > 50) {
      toast.error('Nickname is too long (max 50 characters)')
      submittingRef.current = false
      return
    }

    try {
      const result = await updateProfile({
        ...values,
        nickname: trimmedNickname,
        showOnLeaderboard,
      })

      if (result.error) {
        // Generička poruka — ne exposuj server detalje
        toast.error('Failed to update profile. Please try again.')
      } else {
        toast.success('Profile updated')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      submittingRef.current = false
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md" noValidate>
      {/* Name & Nickname */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            placeholder="Your name"
            maxLength={100}
            {...register('name')}
          />
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
            onChange={e => setNickname(e.target.value.slice(0, 50))}
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
            onValueChange={v => {
              // Whitelist provjera — TypeScript enum to je već, ali runtime check je dobar
              if (TIMEZONES.includes(v as TimezoneValue)) {
                setValue('timezone', v as TimezoneValue)
              }
            }}
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
            onValueChange={v => {
              if (CURRENCIES.includes(v as CurrencyValue)) {
                setValue('currency', v as CurrencyValue)
              }
            }}
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
            aria-label={showOnLeaderboard ? 'Hide from leaderboard' : 'Show on leaderboard'}
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