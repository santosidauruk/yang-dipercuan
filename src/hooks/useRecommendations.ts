import { useQuery } from '@tanstack/react-query'
import { fetchApi } from '@/lib/api'
import type { Recommendation, SignalType } from '@/types'

export function useRecommendations(signal?: SignalType, sector?: string) {
  // TODO:
  // 1. Build query string from signal + sector params
  // 2. Use useQuery with queryKey that includes filter params
  const params = new URLSearchParams()
  if (signal) params.set('signal', signal)
  if (sector) params.set('sector', sector)

  return useQuery<Recommendation[]>({
    queryKey: ['recommendations', signal, sector],
    queryFn: () => fetchApi(`/api/recommendations?${params}`)
  })
}
