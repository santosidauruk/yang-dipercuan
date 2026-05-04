export type UUID = string

export interface Purchase {
  id: UUID
  date: string
  code: string
  price: number
  lots: number
}

export interface Sale {
  id: UUID
  date: string
  code: string
  price: number
  lots: number
  costBasis: number
}

export interface Dividend {
  id: UUID
  date: string
  code: string
  dps: number
}
