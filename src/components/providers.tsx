'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useState, useEffect } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30 * 1000,
            refetchOnWindowFocus: false
          }
        }
      })
  )

  const [mswReady, setMswReady] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      import('@/mocks').then(({ initMocks }) =>
        initMocks().then(() => setMswReady(true))
      )
    } else {
      setMswReady(true)
    }
  }, [])

  if (!mswReady) return null

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>{children}</TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}
