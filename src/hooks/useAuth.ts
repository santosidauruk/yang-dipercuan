'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  name: string
  email: string
  image: string | null
  isOnboarded: boolean
}

interface AuthStore {
  user: AuthUser | null
  isAuthenticated: boolean
  login: (user: AuthUser) => void
  logout: () => void
  devLogin: () => void
}

const DEV_USER: AuthUser = {
  id: 'dev-1',
  name: 'Demo User',
  email: 'demo@stockidx.dev',
  image: null,
  isOnboarded: false
}

export const useAuth = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      devLogin: () => set({ user: DEV_USER, isAuthenticated: true })
    }),
    { name: 'stockidx-auth' }
  )
)
