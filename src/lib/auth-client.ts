import { createAuthClient } from 'better-auth/client'

export const authClient = createAuthClient()

export const signIn = async () => {
  await authClient.signIn.social({
    provider: 'google',
    callbackURL: '/auth/callback'
  })
}
