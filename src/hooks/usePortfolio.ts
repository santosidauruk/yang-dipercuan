import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api'
import { HoldingWithMarket, type Holding, type PortfolioHistory } from '@/types'
import { useStocks } from './useStocks'

export function usePortfolio() {
  return useQuery<Holding[]>({
    queryKey: ['portfolio', 'holdings'],
    queryFn: () => fetchApi('/api/portfolio/holdings')
  })
}

export function usePortfolioWithMarket() {
  const { data: portfolio } = usePortfolio()
  const { data: stocks } = useStocks()
  const codesOfPortfolio = portfolio?.map((holding) => holding.stockCode) ?? []

  return useQuery<HoldingWithMarket[]>({
    queryKey: ['portfolio', codesOfPortfolio.join(',')],
    queryFn: async () => {
      const prices: Record<string, number> = await fetchApi(
        `/api/stocks/prices?codes=${codesOfPortfolio.join(',')}`
      )
      console.log({portfolio, stocks})
      if (!portfolio || !stocks) return []

      const portfolioWithMarket: HoldingWithMarket[] = portfolio.map((p) => {
        const totalCost = p.quantity * p.avgBuyPrice
        const currentPrice = prices[p.stockCode]
        const currentValue = p.quantity * currentPrice
        const unrealizedPnL = currentValue - totalCost
        const unrealizedPnLPercent =
          totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0
        const sector =
          stocks?.find((s) => s.code === p.stockCode)?.sector ?? 'Unknown'
        return {
          ...p,
          totalCost,
          currentPrice,
          currentValue,
          unrealizedPnL,
          unrealizedPnLPercent,
          sector
        }
      })
      return portfolioWithMarket
    },
    enabled: !!codesOfPortfolio.length && !!stocks?.length,
    refetchInterval: 30_000
  })
}

export function usePortfolioHistory() {
  return useQuery<PortfolioHistory[]>({
    queryKey: ['portfolio', 'history'],
    queryFn: () => fetchApi('/api/portfolio/history')
  })
}

export function useAddHolding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (holding: Omit<Holding, 'id'>) =>
      fetchApi<Holding>('/api/portfolio/holdings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(holding)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'holdings'] })
    }
  })
}

export function useUpdateHolding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<Holding> }) =>
      fetchApi<Holding>(`/api/portfolio/holdings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'holdings'] })
    }
  })
}

export function useDeleteHolding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi(`/api/portfolio/holdings/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', 'holdings'] })
    }
  })
}
