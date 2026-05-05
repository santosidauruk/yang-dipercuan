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

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use YYYY-MM-DD'),
  code: z
    .string()
    .min(3, 'Min 3 chars')
    .max(5, 'Max 5 chars')
    .regex(/^[A-Z]+$/, 'Uppercase letters only'),
  dps: z.number().positive('Must be > 0')
})

export type DividendFormValues = z.infer<typeof schema>

interface DividendFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (values: DividendFormValues) => void
}

export function DividendFormDialog({
  open,
  onOpenChange,
  onSubmit
}: DividendFormDialogProps) {
  const form = useForm<DividendFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { date: todayISO(), code: '', dps: 0 }
  })

  useEffect(() => {
    if (open) form.reset({ date: todayISO(), code: '', dps: 0 })
  }, [open, form])

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit(values)
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add dividend</DialogTitle>
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
                  <FormLabel>Receipt Date</FormLabel>
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
            <FormField
              control={form.control}
              name="dps"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>DPS — Dividend Per Share (IDR)</FormLabel>
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
              <Button type="submit">Add</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
