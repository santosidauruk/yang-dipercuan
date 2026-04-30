export type SignalType = 'buy' | 'sell' | 'hold'

export interface Recommendation {
  id: string
  stockCode: string
  stockName: string
  date: string
  signal: SignalType
  score: number
  reasoning: string
  sector: string
  marketCap: number
  peRatio: number | null
  dividendYield: number | null
}
