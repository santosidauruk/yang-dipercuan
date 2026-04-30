import { http, HttpResponse, delay } from 'msw'
import recommendationsData from '../data/recommendations.json'

export const recommendationHandlers = [
  http.get('/api/recommendations', async ({ request }) => {
    await delay(300)
    const { searchParams } = new URL(request.url)
    const signal = searchParams.get('signal')
    const sector = searchParams.get('sector')

    let filtered = [...recommendationsData]

    if (signal) {
      filtered = filtered.filter((r) => r.signal === signal)
    }
    if (sector) {
      filtered = filtered.filter((r) => r.sector === sector)
    }

    filtered.sort((a, b) => b.score - a.score)

    return HttpResponse.json(filtered)
  })
]
