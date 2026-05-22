import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface SettingsStore {
  onboardingDismissed: boolean
  dismissOnboarding: () => void
}

export const useSettings = create<SettingsStore>()(
  persist(
    (set) => ({
      onboardingDismissed: false,
      dismissOnboarding: () => set({ onboardingDismissed: true })
    }),
    { name: 'yangdipercuan:settings' }
  )
)
