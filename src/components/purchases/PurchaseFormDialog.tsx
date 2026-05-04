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
import { CodeAutocomplete } from './CodeAutocomplete'
import { todayISO } from '@/lib/date'
import type { Purchase } from '@/types'

const schema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  code: z
    .string()
    .min(3, 'Min 3 chars')
    .max(5, 'Max 5 chars')
    .regex(/^[A-Z]+$/, 'Uppercase letters only'),
  price: z.number().positive('Must be > 0'),
  lots: z.number().int('Whole lots only').positive('Must be > 0')
})

export type PurchaseFormValues = z.infer<typeof schema>

interface PurchaseFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initial?: Purchase
  onSubmit: (values: PurchaseFormValues) => void
}

export function PurchaseFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit
}: PurchaseFormDialogProps) {
  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      date: initial?.date ?? todayISO(),
      code: initial?.code ?? '',
      price: initial?.price ?? 0,
      lots: initial?.lots ?? 0
    }
  })

  useEffect(() => {
    if (open) {
      form.reset({
        date: initial?.date ?? todayISO(),
        code: initial?.code ?? '',
        price: initial?.price ?? 0,
        lots: initial?.lots ?? 0
      })
    }
  }, [open, initial, form])

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values)
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial ? 'Edit purchase' : 'Add purchase'}</DialogTitle>
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
                    <FormLabel>Price (IDR)</FormLabel>
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
