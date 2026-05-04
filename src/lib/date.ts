import { format, parseISO } from 'date-fns'

export function formatDateDisplay(iso: string): string {
  return format(parseISO(iso), 'dd/MM/yyyy')
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
