import { beforeEach, describe, it, expect, vi } from 'vitest'
import { useSettings } from './useSettings'

describe('useSettings', () => {
  beforeEach(() => {
    localStorage.clear()
    useSettings.setState({ onboardingDismissed: false })
  })

  it('starts with onboardingDismissed false', () => {
    expect(useSettings.getState().onboardingDismissed).toBe(false)
  })

  it('dismissOnboarding flips flag to true', () => {
    useSettings.getState().dismissOnboarding()
    expect(useSettings.getState().onboardingDismissed).toBe(true)
  })

  it('persists under yangdipercuan:settings', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem')
    useSettings.getState().dismissOnboarding()

    const calls = setItem.mock.calls.filter(
      ([key]) => key === 'yangdipercuan:settings'
    )
    expect(calls.length).toBeGreaterThan(0)
    setItem.mockRestore()
  })
})
