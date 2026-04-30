'use client'

import { cn } from '@/lib/utils'
import { formatPercentage, formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface PriceChangeProps {
  value: number
  percentage: number
  showIcon?: boolean
  showValue?: boolean
  className?: string
}

export function PriceChange({
  value,
  percentage,
  showIcon = true,
  showValue = true,
  className
}: PriceChangeProps) {
  const isPositive = percentage > 0
  const isNegative = percentage < 0

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-sm font-medium',
        isPositive && 'text-green-600 dark:text-green-400',
        isNegative && 'text-red-600 dark:text-red-400',
        !isPositive && !isNegative && 'text-muted-foreground',
        className
      )}
    >
      {showIcon &&
        (isPositive ? (
          <TrendingUp className="h-3.5 w-3.5" />
        ) : isNegative ? (
          <TrendingDown className="h-3.5 w-3.5" />
        ) : (
          <Minus className="h-3.5 w-3.5" />
        ))}
      {showValue && <span>{formatCurrency(Math.abs(value))}</span>}
      <span>({formatPercentage(percentage)})</span>
    </span>
  )
}
