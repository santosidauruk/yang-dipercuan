import { portfolioHandlers } from './portfolio'
import { recommendationHandlers } from './recommendations'
import { riskProfileHandlers } from './risk-profile'
import { userHandlers } from './user'
import { watchlistHandlers } from './watchlist'

export const handlers = [
  ...portfolioHandlers,
  ...recommendationHandlers,
  ...riskProfileHandlers,
  ...userHandlers,
  ...watchlistHandlers
]
