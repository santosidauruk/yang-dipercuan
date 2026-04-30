'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { HoldingWithMarket } from '@/types'
import { fetchApi } from '@/lib/api'
import type { StockDetail } from '@/types'
import { useAddHolding, useUpdateHolding } from '@/hooks/usePortfolio'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const normalizeCode = (c: string) => {
  const upper = c.trim().toUpperCase()
  return upper.endsWith('.JK') ? upper : `${upper}.JK`
}

const schema = z.object({
  stockCode: z.string().min(1, 'Stock code is required'),
  quantity: z.number().int().positive('Must be a positive integer'),
  avgBuyPrice: z.number().positive('Must be a positive number'),
  buyDate: z.string().min(1, 'Buy date is required'),
  notes: z.string().optional()
})

type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  holding?: HoldingWithMarket
}

export function HoldingForm({ open, onOpenChange, holding }: Props) {
  const isEdit = !!holding
  const addHolding = useAddHolding()
  const updateHolding = useUpdateHolding()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      stockCode: '',
      quantity: undefined,
      avgBuyPrice: undefined,
      buyDate: '',
      notes: ''
    }
  })

  useEffect(() => {
    if (open) {
      if (holding) {
        form.reset({
          stockCode: holding.stockCode,
          quantity: holding.quantity,
          avgBuyPrice: holding.avgBuyPrice,
          buyDate: holding.buyDate,
          notes: holding.notes ?? ''
        })
      } else {
        form.reset({
          stockCode: '',
          quantity: undefined,
          avgBuyPrice: undefined,
          buyDate: '',
          notes: ''
        })
      }
    }
  }, [open, holding, form])

  async function onSubmit(values: FormValues) {
    const stockCode = normalizeCode(values.stockCode)

    if (!isEdit) {
      // Resolve stock name from API
      let stockName: string
      try {
        const detail = await fetchApi<StockDetail>(`/api/stocks/${stockCode}`)
        stockName = detail.name
      } catch {
        toast.error('Stock not found. Check the stock code and try again.')
        return
      }

      addHolding.mutate(
        {
          stockCode,
          stockName,
          quantity: values.quantity,
          avgBuyPrice: values.avgBuyPrice,
          buyDate: values.buyDate,
          notes: values.notes,
          isActive: true
        },
        {
          onSuccess: () => {
            toast.success('Holding added')
            onOpenChange(false)
          },
          onError: (err) => {
            toast.error(err.message)
          }
        }
      )
    } else {
      updateHolding.mutate(
        {
          id: holding.id,
          patch: {
            quantity: values.quantity,
            avgBuyPrice: values.avgBuyPrice,
            buyDate: values.buyDate,
            notes: values.notes
          }
        },
        {
          onSuccess: () => {
            toast.success('Holding updated')
            onOpenChange(false)
          },
          onError: (err) => {
            toast.error(err.message)
          }
        }
      )
    }
  }

  const isPending = addHolding.isPending || updateHolding.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Holding' : 'Add Holding'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="stockCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Code</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. BBCA"
                      {...field}
                      disabled={isEdit}
                      className={isEdit ? 'opacity-60' : ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantity (lots)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      placeholder="100"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const val = e.target.valueAsNumber
                        field.onChange(Number.isNaN(val) ? undefined : val)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="avgBuyPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Avg Buy Price (IDR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      placeholder="8500"
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        const val = e.target.valueAsNumber
                        field.onChange(Number.isNaN(val) ? undefined : val)
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="buyDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Buy Date</FormLabel>
                  <FormControl>
                    <Input
                      type="date"
                      max={new Date().toISOString().slice(0, 10)}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Long term hold..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? 'Saving...'
                  : isEdit
                    ? 'Save Changes'
                    : 'Add Holding'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
