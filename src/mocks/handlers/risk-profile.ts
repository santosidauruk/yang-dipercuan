import { http, HttpResponse, delay } from 'msw'
import type { RiskProfile } from '@/types'

let riskProfile: RiskProfile | null = null

export const riskProfileHandlers = [
  http.get('/api/risk-profile', async () => {
    await delay(300)
    if (!riskProfile) {
      return HttpResponse.json(null)
    }
    return HttpResponse.json(riskProfile)
  }),

  http.post('/api/risk-profile', async ({ request }) => {
    await delay(500)
    const body = (await request.json()) as RiskProfile
    riskProfile = { ...body, completedAt: new Date().toISOString() }
    return HttpResponse.json(riskProfile, { status: 201 })
  })
]
