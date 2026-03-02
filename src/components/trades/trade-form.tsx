//src/components/trades/trade-form.tsx


'use client'

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Trade } from '@/types/trade'

interface TradeFormProps {
  trade?: Trade
  onSuccess?: () => void
}

export function TradeForm({ trade, onSuccess }: TradeFormProps) {
  const router = useRouter()
  const isEdit = !!trade

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema),
    defaultValues: trade
      ? {
          symbol: trade.symbol,
          direction: trade.direction,
          status: trade.status,
          session: trade.session ?? undefined,
          entryPrice: Number(trade.entryPrice),
          exitPrice: trade.exitPrice ? Number(trade.exitPrice) : undefined,
          stopLoss: trade.stopLoss ? Number(trade.stopLoss) : undefined,
          takeProfit: trade.takeProfit ? Number(trade.takeProfit) : undefined,
          lotSize: Number(trade.lotSize),
          commission: Number(trade.commission ?? 0),
          swap: Number(trade.swap ?? 0),
          openedAt: trade.openedAt
            ? new Date(trade.openedAt).toISOString().slice(0, 16)
            : '',
          closedAt: trade.closedAt
            ? new Date(trade.closedAt).toISOString().slice(0, 16)
            : undefined,
          emotionTag: trade.emotionTag ?? undefined,
          notes: trade.notes ?? undefined,
        }
      : {
          direction: 'LONG',
          status: 'CLOSED',
          commission: 0,
          swap: 0,
          openedAt: new Date().toISOString().slice(0, 16),
        },
  })

  const status = watch('status')

  async function onSubmit(values: TradeFormValues) {
    const result = isEdit
      ? await updateTrade(trade!.id, values)
      : await createTrade(values)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success(isEdit ? 'Trade updated' : 'Trade added')
    if (onSuccess) {
      onSuccess()
    } else {
      router.push('/trades')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Symbol & Direction */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="symbol">Symbol *</Label>
          <Input
            id="symbol"
            placeholder="EURUSD"
            className="uppercase"
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
            onValueChange={(v) => setValue('direction', v as 'LONG' | 'SHORT')}
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
            onValueChange={(v) => setValue('status', v as any)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
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
            onValueChange={(v) => setValue('session', v as any)}
            defaultValue={watch('session')}
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
            placeholder="1.09500"
            {...register('takeProfit')}
          />
        </div>
      </div>

      {/* Lot size & Commission */}
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="lotSize">Lot Size *</Label>
          <Input
            id="lotSize"
            type="number"
            step="any"
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
          onValueChange={(v) => setValue('emotionTag', v as any)}
          defaultValue={watch('emotionTag')}
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