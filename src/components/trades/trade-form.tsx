//src/components/trades/trade-form.tsx
'use client'

import { useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { createTrade, updateTrade } from '@/actions/trades'
import { tradeFormSchema, type TradeFormValues } from '@/lib/validators/trade'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'

const VALID_DIRECTIONS = ['LONG', 'SHORT'] as const
const VALID_STATUSES = ['CLOSED', 'OPEN', 'BREAKEVEN', 'PARTIALLY_CLOSED'] as const
const VALID_SESSIONS = ['ASIAN', 'LONDON', 'NEW_YORK', 'PACIFIC', 'OVERLAP_LONDON_NY'] as const
const VALID_EMOTIONS = ['CONFIDENT', 'FEARFUL', 'GREEDY', 'NEUTRAL', 'REVENGE', 'FOMO', 'PATIENT'] as const

type DirectionValue = typeof VALID_DIRECTIONS[number]
type StatusValue = typeof VALID_STATUSES[number]
type SessionValue = typeof VALID_SESSIONS[number]
type EmotionValue = typeof VALID_EMOTIONS[number]

interface TradeFormProps {
  tradeId?: string
  defaultValues?: Partial<TradeFormValues>
}

export function TradeForm({ tradeId, defaultValues }: TradeFormProps) {
  const router = useRouter()
  const isEdit = !!tradeId
  const submittingRef = useRef(false)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: defaultValues ?? {
      direction: 'LONG',
      status: 'CLOSED',
      commission: 0,
      swap: 0,
      openedAt: new Date().toISOString().slice(0, 16),
    },
  })

  const status = watch('status')

  async function onSubmit(values: TradeFormValues) {
    if (submittingRef.current) return
    submittingRef.current = true

    try {
      const result = isEdit
        ? await updateTrade(tradeId!, values)
        : await createTrade(values)

      if (result.error) {
        toast.error('Failed to save trade. Please check your inputs.')
        return
      }

      toast.success(isEdit ? 'Trade updated' : 'Trade added')
      router.push(isEdit ? `/trades/${tradeId}` : '/trades')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      submittingRef.current = false
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Symbol & Direction */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="symbol">Symbol *</Label>
          <Input
            id="symbol"
            placeholder="EURUSD"
            className="uppercase"
            maxLength={20}
            {...register('symbol')}
          />
          {errors.symbol && (
            <p className="text-destructive text-sm">{errors.symbol.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Direction *</Label>
          <Select
            defaultValue={watch('direction')}
            onValueChange={v => {
              if (VALID_DIRECTIONS.includes(v as DirectionValue)) {
                setValue('direction', v as DirectionValue)
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LONG">
                <span className="text-emerald-500 font-medium">▲ Long</span>
              </SelectItem>
              <SelectItem value="SHORT">
                <span className="text-red-500 font-medium">▼ Short</span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Status & Session */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Status *</Label>
          <Select
            defaultValue={watch('status')}
            onValueChange={v => {
              if (VALID_STATUSES.includes(v as StatusValue)) {
                setValue('status', v as StatusValue)
              }
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="CLOSED">Closed</SelectItem>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="BREAKEVEN">Breakeven</SelectItem>
              <SelectItem value="PARTIALLY_CLOSED">Partially Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Session</Label>
          <Select
            defaultValue={watch('session')}
            onValueChange={v => {
              if (VALID_SESSIONS.includes(v as SessionValue)) {
                setValue('session', v as SessionValue)
              }
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ASIAN">Asian</SelectItem>
              <SelectItem value="LONDON">London</SelectItem>
              <SelectItem value="NEW_YORK">New York</SelectItem>
              <SelectItem value="PACIFIC">Pacific</SelectItem>
              <SelectItem value="OVERLAP_LONDON_NY">London/NY Overlap</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Prices */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="entryPrice">Entry Price *</Label>
          <Input
            id="entryPrice"
            type="number"
            step="any"
            min={0}
            placeholder="1.08500"
            {...register('entryPrice')}
          />
          {errors.entryPrice && (
            <p className="text-destructive text-sm">{errors.entryPrice.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="exitPrice">Exit Price</Label>
          <Input
            id="exitPrice"
            type="number"
            step="any"
            min={0}
            placeholder="1.09000"
            disabled={status === 'OPEN'}
            {...register('exitPrice')}
          />
        </div>
      </div>

      {/* SL & TP */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="stopLoss">Stop Loss</Label>
          <Input
            id="stopLoss"
            type="number"
            step="any"
            min={0}
            placeholder="1.08000"
            {...register('stopLoss')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="takeProfit">Take Profit</Label>
          <Input
            id="takeProfit"
            type="number"
            step="any"
            min={0}
            placeholder="1.09500"
            {...register('takeProfit')}
          />
        </div>
      </div>

      {/* Lot size & Commission & Swap */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lotSize">Lot Size *</Label>
          <Input
            id="lotSize"
            type="number"
            step="any"
            min={0}
            max={10000}
            placeholder="0.10"
            {...register('lotSize')}
          />
          {errors.lotSize && (
            <p className="text-destructive text-sm">{errors.lotSize.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="commission">Commission</Label>
          <Input
            id="commission"
            type="number"
            step="any"
            placeholder="0.00"
            {...register('commission')}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="swap">Swap</Label>
          <Input
            id="swap"
            type="number"
            step="any"
            placeholder="0.00"
            {...register('swap')}
          />
        </div>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="openedAt">Opened At *</Label>
          <Input
            id="openedAt"
            type="datetime-local"
            {...register('openedAt')}
          />
          {errors.openedAt && (
            <p className="text-destructive text-sm">{errors.openedAt.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="closedAt">Closed At</Label>
          <Input
            id="closedAt"
            type="datetime-local"
            disabled={status === 'OPEN'}
            {...register('closedAt')}
          />
        </div>
      </div>

      {/* Emotion */}
      <div className="space-y-2">
        <Label>Emotion Tag</Label>
        <Select
          defaultValue={watch('emotionTag')}
          onValueChange={v => {
            if (VALID_EMOTIONS.includes(v as EmotionValue)) {
              setValue('emotionTag', v as EmotionValue)
            }
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="How did you feel?" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CONFIDENT">😎 Confident</SelectItem>
            <SelectItem value="FEARFUL">😨 Fearful</SelectItem>
            <SelectItem value="GREEDY">🤑 Greedy</SelectItem>
            <SelectItem value="NEUTRAL">😐 Neutral</SelectItem>
            <SelectItem value="REVENGE">😤 Revenge</SelectItem>
            <SelectItem value="FOMO">😰 FOMO</SelectItem>
            <SelectItem value="PATIENT">🧘 Patient</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Trade reasoning, observations..."
          rows={3}
          maxLength={2000}
          {...register('notes')}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting
            ? isEdit ? 'Updating...' : 'Adding...'
            : isEdit ? 'Update Trade' : 'Add Trade'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}