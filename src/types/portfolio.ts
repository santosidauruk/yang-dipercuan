export interface Holding {
  id: string
  stockCode: string
  stockName: string
  quantity: number
  avgBuyPrice: number
  buyDate: string
  notes?: string
  isActive: boolean
}

export interface HoldingWithMarket extends Holding {
  currentPrice: number
  currentValue: number
  totalCost: number
  unrealizedPnL: number
  unrealizedPnLPercent: number
  sector: string
}

export interface PortfolioSummary {
  totalValue: number
  totalCost: number
  totalPnL: number
  totalPnLPercent: number
  dailyChange: number
  dailyChangePercent: number
}

export interface AllocationItem {
  name: string
  value: number
  percentage: number
  color: string
}

export interface PortfolioHistory {
  date: string
  value: number
}
