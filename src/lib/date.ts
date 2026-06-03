import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale/id'

export function formatDateDisplay(iso: string): string {
  return format(parseISO(iso), 'd MMMM yyyy', { locale: id })
}

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd')
}
