import { http, HttpResponse, delay } from 'msw'
import { AuthUser } from '@/hooks/useAuth'

let isOnboarded = false

export const userHandlers = [
  http.get('/api/users/me', async () => {
    await delay(300)
    return HttpResponse.json<AuthUser>({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      image: 'image.jpg',
      isOnboarded
    })
  }),

  http.post('/api/users/onboard', async () => {
    await delay(500)
    isOnboarded = true
    return HttpResponse.json({ success: true })
  })
]
