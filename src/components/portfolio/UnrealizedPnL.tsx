import { formatCurrency, formatPercentage } from '@/lib/utils'

interface Props {
  value: number
  percent: number
  compact?: boolean
}

export function UnrealizedPnL({ value, percent, compact = false }: Props) {
  const colorClass =
    value > 0 ? 'text-green-500' : value < 0 ? 'text-red-500' : ''

  if (compact) {
    return <span className={colorClass}>{formatPercentage(percent)}</span>
  }

  return (
    <div className={colorClass}>
      <p className="text-lg font-semibold">{formatCurrency(value)}</p>
      <p className="text-sm">{formatPercentage(percent)}</p>
    </div>
  )
}
