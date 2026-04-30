import { http, HttpResponse, delay } from 'msw'

let watchlist: string[] = ['BBCA.JK', 'BBRI.JK', 'TLKM.JK']

export const watchlistHandlers = [
  http.get('/api/watchlist', async () => {
    await delay(200)
    return HttpResponse.json(watchlist)
  }),

  http.post('/api/watchlist/:code', async ({ params }) => {
    await delay(200)
    const code = params.code as string
    if (!watchlist.includes(code)) {
      watchlist.push(code)
    }
    return HttpResponse.json({ success: true })
  }),

  http.delete('/api/watchlist/:code', async ({ params }) => {
    await delay(200)
    const code = params.code as string
    watchlist = watchlist.filter((c) => c !== code)
    return HttpResponse.json({ success: true })
  })
]
