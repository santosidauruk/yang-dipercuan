import { UTCTimestamp } from 'lightweight-charts'

export interface Stock {
  code: string
  name: string
  sector: string
  price: number
  previousClose: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  high: number
  low: number
  open: number
}

export interface StockDetail extends Stock {
  currency: string
  exchange: string
  peRatio: number | null
  pbRatio: number | null
  dividendYield: number | null
  roe: number | null
  eps: number | null
  fiftyTwoWeekHigh: number
  fiftyTwoWeekLow: number
  description: string
}

export interface StockPrice {
  code: string
  price: number
}

export interface OHLCV {
  time: UTCTimestamp // unix timestamp
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type Timeframe = '1m' | '5m' | '15m' | '1h' | '1D' | '1W' | '1M'

export interface StockSearchResult {
  code: string
  name: string
  sector: string
  exchange: string
}
