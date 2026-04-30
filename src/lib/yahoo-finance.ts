import YahooFinance from 'yahoo-finance2'
import { QuoteField } from 'yahoo-finance2/modules/quote'

const yahooFinance = new YahooFinance()
/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getQuote(
  symbol: string | string[],
  fields: QuoteField[] = []
): Promise<any> {
  return await yahooFinance.quote(symbol, { fields })
}

export async function getQuotes(
  symbols: string[],
  fields: QuoteField[] = []
): Promise<any[]> {
  const results = await Promise.allSettled(
    symbols.map((symbol) => yahooFinance.quote(symbol, { fields }))
  )

  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<any>).value)
}

export async function getHistoricalData(
  symbol: string,
  interval: string,
  range: string
): Promise<any> {
  const result = await yahooFinance.chart(symbol, {
    period1: getStartDate(range),
    interval: interval as '1d' | '1wk' | '1mo'
  })
  return result
}

export async function searchStocks(query: string): Promise<any> {
  return await yahooFinance.search(query, {
    newsCount: 0,
    quotesCount: 10
  })
}

function getStartDate(range: string): Date {
  const now = new Date()
  switch (range) {
    case '1d':
      return new Date(now.setDate(now.getDate() - 1))
    case '5d':
      return new Date(now.setDate(now.getDate() - 5))
    case '1mo':
      return new Date(now.setMonth(now.getMonth() - 1))
    case '6mo':
      return new Date(now.setMonth(now.getMonth() - 6))
    case '1y':
      return new Date(now.setFullYear(now.getFullYear() - 1))
    case '2y':
      return new Date(now.setFullYear(now.getFullYear() - 2))
    case '5y':
      return new Date(now.setFullYear(now.getFullYear() - 5))
    default:
      return new Date(now.setMonth(now.getMonth() - 6))
  }
}
