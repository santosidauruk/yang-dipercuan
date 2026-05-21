'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { CodeAutocomplete } from '@/components/purchases/CodeAutocomplete'
import { todayISO } from '@/lib/date'
import { costBasisAt } from '@/lib/portfolio'
import type { Purchase, Sale } from '@/types'

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  code: z
    .string()
    .min(3, 'Min 3 chars')
    .max(5, 'Max 5 chars')
    .regex(/^[A-Z]+$/, 'Uppercase letters only'),
  price: z.number().positive('Must be > 0'),
  lots: z.number().int('Whole lots only').positive('Must be > 0'),
  costBasis: z.number().positive('Must be > 0')
})

export type SaleFormValues = z.infer<typeof schema>

interface SaleFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Sale
  draft?: SaleFormValues | null
  purchases: Purchase[]
  onSubmit: (values: SaleFormValues) => void
}

export function SaleFormDialog({
  open,
  onOpenChange,
  initial,
  draft,
  purchases,
  onSubmit
}: SaleFormDialogProps) {
  const form = useForm<SaleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: draft ?? {
      date: initial?.date ?? todayISO(),
      code: initial?.code ?? '',
      price: initial?.price ?? 0,
      lots: initial?.lots ?? 0,
      costBasis: initial?.costBasis ?? 0
    }
  })

  useEffect(() => {
    if (open) {
      form.reset(
        draft ?? {
          date: initial?.date ?? todayISO(),
          code: initial?.code ?? '',
          price: initial?.price ?? 0,
          lots: initial?.lots ?? 0,
          costBasis: initial?.costBasis ?? 0
        }
      )
    }
  }, [open, initial, draft, form])

  const watchCode = form.watch('code')
  const watchDate = form.watch('date')

  useEffect(() => {
    if (!initial && watchCode && watchDate) {
      const basis = costBasisAt(purchases, watchCode, watchDate)
      if (basis > 0) form.setValue('costBasis', basis)
    }
  }, [watchCode, watchDate, purchases, initial, form])

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values)
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit sale' : 'Add sale'}</DialogTitle>
          <DialogDescription>
            Records persist locally in your browser.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <CodeAutocomplete
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sell Price (IDR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="decimal"
                        step="any"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? NaN : e.target.valueAsNumber
                          )
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lots"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lots</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        step="1"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === '' ? NaN : e.target.valueAsNumber
                          )
                        }
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="costBasis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cost Basis (IDR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === '' ? NaN : e.target.valueAsNumber
                        )
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">{initial ? 'Save' : 'Add'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
