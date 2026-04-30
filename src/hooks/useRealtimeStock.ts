import { RealtimeQueryOptions, useStockDetail } from './useStocks'

export function useRealtimeStockDetail(
  code: string,
  options: RealtimeQueryOptions = {}
) {
  return useStockDetail(code, {
    ...options,
    refetchIntervalInBackground: true,
    gcTime: 0
  })
}
