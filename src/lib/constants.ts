import type { Timeframe } from '@/types'

export const TIMEFRAMES: {
  value: Timeframe
  label: string
  interval: string
  range: string
}[] = [
  { value: '1m', label: '1M', interval: '1m', range: '1d' },
  { value: '5m', label: '5M', interval: '5m', range: '5d' },
  { value: '15m', label: '15M', interval: '15m', range: '5d' },
  { value: '1h', label: '1H', interval: '60m', range: '1mo' },
  { value: '1D', label: '1D', interval: '1d', range: '6mo' },
  { value: '1W', label: '1W', interval: '1wk', range: '2y' },
  { value: '1M', label: '1MO', interval: '1mo', range: '5y' }
]

export const CHART_COLORS = [
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#f59e0b',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#f97316',
  '#14b8a6',
  '#6366f1'
]

export const IHSG_CODE = '^JKSE'
