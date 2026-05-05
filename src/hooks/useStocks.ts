import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api'
import type { Stock, StockDetail, OHLCV, StockSearchResult } from '@/types'

export interface RealtimeQueryOptions {
  refetchInterval?: number
  refetchIntervalInBackground?: boolean
  gcTime?: number
}

export function useStocksPrices(codes: string[]) {
  const codeParams = codes.join(',')
  return useQuery<Record<Stock['code'], Stock['price']>>({
    queryKey: ['stocks', codes],
    queryFn: () => fetchApi(`/api/stocks/prices?codes=${codeParams}`),
    enabled: !!codeParams,
    refetchInterval: 30_000
  })
}

export type StockQuote = { price: number; changePercent: number }

export function useStocksQuotes(codes: string[]) {
  const codeParams = codes.join(',')
  return useQuery<Record<string, StockQuote>>({
    queryKey: ['stock-quotes', codes],
    queryFn: () => fetchApi(`/api/stocks/quotes?codes=${codeParams}`),
    enabled: !!codeParams,
    refetchInterval: 30_000
  })
}

export function useStockDetail(
  code: string,
  options: RealtimeQueryOptions = {
    refetchInterval: 30_000
  }
) {
  return useQuery<StockDetail>({
    queryKey: ['stock', code],
    queryFn: () => fetchApi(`/api/stocks/${code}`),
    enabled: !!code,
    ...options
  })
}

export function useStockHistory(code: string, interval: string, range: string) {
  return useQuery<OHLCV[]>({
    queryKey: ['stock-history', code, interval, range],
    queryFn: () =>
      fetchApi(
        `/api/stocks/${code}/history?interval=${interval}&range=${range}`
      ),
    enabled: !!code,
    refetchInterval: 30_000
  })
}

export function useStockSearch(query: string) {
  return useQuery<StockSearchResult[]>({
    queryKey: ['stock-search', query],
    queryFn: () =>
      fetchApi(`/api/stocks/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 1
  })
}
