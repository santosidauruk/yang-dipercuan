export type RiskLevel = 'conservative' | 'moderate' | 'aggressive'

export interface RiskProfile {
  level: RiskLevel
  score: number // 0-100
  investmentGoal: string
  investmentHorizon: string
  monthlyInvestment: number
  experienceLevel: string
  completedAt: string
}

export interface AssetAllocation {
  saham: number
  obligasi: number
  reksaDanaPasarUang: number
  deposito: number
}

export interface InvestmentGoal {
  id: string
  name: string
  targetAmount: number
  targetDate: string
  currentSavings: number
  monthlyContribution: number
  createdAt: string
}
