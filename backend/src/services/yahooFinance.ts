/**
 * Yahoo Finance API 서비스 (Backend)
 * CORS 프록시 없이 직접 API 호출
 */

import axios from 'axios'
import type { FundamentalData, PriceData, Market } from '../types/index.js'

/**
 * 종목 코드를 Yahoo Finance 심볼로 변환
 */
export function toYahooSymbol(symbol: string, market: Market): string {
  switch (market) {
    case 'KOSPI':
      return `${symbol}.KS`
    case 'KOSDAQ':
      return `${symbol}.KQ`
    default:
      return symbol
  }
}

/**
 * 종목의 실시간 시세 및 기본 정보 가져오기
 */
export async function getStockQuote(symbol: string, market: Market): Promise<{
  name: string
  currentPrice: number
  previousClose: number
  change: number
  changePercent: number
  currency: 'KRW' | 'USD'
  fundamentals: FundamentalData
}> {
  const yahooSymbol = toYahooSymbol(symbol, market)
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=5d&interval=1d`

  console.log(`[API] ${symbol} 시세 조회...`)

  let response
  try {
    response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 10000,
    })
  } catch (error) {
    console.error(`[API] ${symbol} 시세 조회 실패:`, error instanceof Error ? error.message : error)
    throw new Error(`Failed to fetch quote for ${symbol}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  const result = response.data.chart?.result?.[0]
  if (!result) {
    throw new Error(`No data found for symbol: ${symbol}`)
  }

  const meta = result.meta || {}
  const quote = result.indicators?.quote?.[0]
  const timestamps = result.timestamp || []

  // 배열 범위 검사
  const lastIndex = timestamps.length > 0 ? timestamps.length - 1 : -1
  const currentPrice = meta.regularMarketPrice || (lastIndex >= 0 && quote?.close?.[lastIndex] != null ? quote.close[lastIndex] : 0)
  // 전일 종가: regularMarketPreviousClose 또는 previousClose 사용 (chartPreviousClose는 차트 범위 시작점이므로 제외)
  const previousClose = meta.regularMarketPreviousClose || meta.previousClose ||
    (lastIndex >= 1 && quote?.close?.[lastIndex - 1] != null ? quote.close[lastIndex - 1] : currentPrice)
  const change = currentPrice - previousClose
  const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

  const isKoreanMarket = market === 'KOSPI' || market === 'KOSDAQ'
  const currency: 'KRW' | 'USD' = meta.currency === 'KRW' || isKoreanMarket ? 'KRW' : 'USD'

  return {
    name: meta.longName || meta.shortName || symbol,
    currentPrice,
    previousClose,
    change,
    changePercent,
    currency,
    fundamentals: {
      per: generateSampleFundamental(symbol, 'per'),
      pbr: generateSampleFundamental(symbol, 'pbr'),
      roe: generateSampleFundamental(symbol, 'roe'),
      operatingMargin: generateSampleFundamental(symbol, 'operatingMargin'),
      eps: generateSampleFundamental(symbol, 'eps'),
      marketCap: generateSampleFundamental(symbol, 'marketCap'),
      debtRatio: generateSampleFundamental(symbol, 'debtRatio'),
      currentRatio: generateSampleFundamental(symbol, 'currentRatio'),
      epsGrowth: generateSampleFundamental(symbol, 'epsGrowth'),
      revenueGrowth: generateSampleFundamental(symbol, 'revenueGrowth'),
    },
  }
}

/**
 * 심볼 기반 샘플 재무 데이터 생성 (일관된 값 반환)
 */
function generateSampleFundamental(symbol: string, type: string): number | null {
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const seed = hash + type.length

  switch (type) {
    case 'per':
      return 5 + (seed % 40)
    case 'pbr':
      return 0.5 + (seed % 50) / 10
    case 'roe':
      return 5 + (seed % 30)
    case 'operatingMargin':
      return 5 + (seed % 25)
    case 'eps':
      return (seed % 100) + 1
    case 'marketCap':
      return (seed % 500 + 50) * 1e9
    case 'debtRatio':
      return 30 + (seed % 200)
    case 'currentRatio':
      return 50 + (seed % 200)
    case 'epsGrowth':
      return -30 + (seed % 80)
    case 'revenueGrowth':
      return -20 + (seed % 60)
    default:
      return null
  }
}

/**
 * 과거 가격 데이터 가져오기
 */
export async function getHistoricalPrices(
  symbol: string,
  market: Market,
  period: '1mo' | '3mo' | '6mo' | '1y' = '6mo'
): Promise<PriceData[]> {
  const yahooSymbol = toYahooSymbol(symbol, market)
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=${period}&interval=1d`

  console.log(`[API] ${symbol} 히스토리 조회 (${period})...`)

  let response
  try {
    response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000,
    })
  } catch (error) {
    console.error(`[API] ${symbol} 히스토리 조회 실패:`, error instanceof Error ? error.message : error)
    return []
  }

  const result = response.data.chart?.result?.[0]
  if (!result || !result.timestamp) {
    console.warn(`[API] ${symbol} 히스토리 데이터 없음`)
    return []
  }

  const timestamps = result.timestamp
  const quote = result.indicators?.quote?.[0]
  if (!quote) {
    return []
  }

  const prices: PriceData[] = []
  for (let i = 0; i < timestamps.length; i++) {
    if (
      quote.open?.[i] != null &&
      quote.high?.[i] != null &&
      quote.low?.[i] != null &&
      quote.close?.[i] != null &&
      quote.volume?.[i] != null
    ) {
      prices.push({
        date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
        open: quote.open[i],
        high: quote.high[i],
        low: quote.low[i],
        close: quote.close[i],
        volume: quote.volume[i],
      })
    }
  }

  return prices
}
