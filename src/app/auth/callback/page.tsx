'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { fetchApi } from '@/lib/api'

interface UserResponse {
  id: string
  isOnboarded: boolean
}

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    fetchApi<UserResponse>('/api/users/me')
      .then((user) => {
        router.replace(user.isOnboarded ? '/dashboard' : '/onboard')
      })
      .catch(() => {
        router.replace('/login')
      })
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Redirecting...</p>
    </div>
  )
}
