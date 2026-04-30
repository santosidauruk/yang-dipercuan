import { http, HttpResponse, delay } from 'msw'
import portfolioData from '../data/portfolio.json'
import portfolioHistory from '../data/portfolio-history.json'
import type { Holding } from '@/types'

const holdings: Holding[] = [...portfolioData.holdings].filter(
  (h) => h.isActive
)

export const portfolioHandlers = [
  http.get('/api/portfolio/holdings', async () => {
    await delay(300)
    return HttpResponse.json(holdings)
  }),

  http.post('/api/portfolio/holdings', async ({ request }) => {
    await delay(300)
    const body = (await request.json()) as Omit<Holding, 'id'>
    const newHolding: Holding = {
      ...body,
      id: `h${Date.now()}`,
      isActive: true
    }
    holdings.push(newHolding)
    return HttpResponse.json(newHolding, { status: 201 })
  }),

  http.put('/api/portfolio/holdings/:id', async ({ params, request }) => {
    await delay(300)
    const { id } = params
    const body = (await request.json()) as Partial<Holding>
    const index = holdings.findIndex((h) => h.id === id)
    if (index === -1) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    }
    holdings[index] = { ...holdings[index], ...body }
    return HttpResponse.json(holdings[index])
  }),

  http.get('/api/portfolio/history', async () => {
    await delay(300)
    return HttpResponse.json(portfolioHistory)
  }),

  http.delete('/api/portfolio/holdings/:id', async ({ params }) => {
    await delay(300)
    const { id } = params
    const index = holdings.findIndex((h) => h.id === id)
    if (index === -1) {
      return HttpResponse.json({ error: 'Not found' }, { status: 404 })
    }
    holdings[index].isActive = false
    return HttpResponse.json({ success: true })
  })
]
