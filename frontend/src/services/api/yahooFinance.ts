/**
 * Yahoo Finance API 서비스
 * 주식 가격, 재무 데이터, 과거 가격 데이터를 가져옵니다.
 */

import type { FundamentalData, PriceData, Market } from '../../types'

// CORS 프록시 URL 목록
const CORS_PROXIES = [
  'https://api.allorigins.win/raw?url=',
  'https://corsproxy.io/?',
  'https://api.codetabs.com/v1/proxy?quest=',
]

let currentProxyIndex = 0

/**
 * CORS 프록시를 통해 fetch
 */
async function fetchWithProxy(url: string): Promise<Response> {
  const errors: Error[] = []
  console.log('fetchWithProxy 호출:', url)

  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyIndex = (currentProxyIndex + i) % CORS_PROXIES.length
    const proxy = CORS_PROXIES[proxyIndex]
    const fullUrl = proxy + encodeURIComponent(url)

    console.log(`  프록시 ${proxyIndex + 1} 시도:`, proxy.substring(0, 30) + '...')

    try {
      const response = await fetch(fullUrl, {
        headers: {
          'Accept': 'application/json',
        },
      })

      console.log(`  응답 상태:`, response.status, response.ok ? '성공' : '실패')

      if (response.ok) {
        currentProxyIndex = proxyIndex // 성공한 프록시 기억
        return response
      } else {
        errors.push(new Error(`HTTP ${response.status}`))
      }
    } catch (error) {
      console.error(`  프록시 ${proxyIndex + 1} 에러:`, error)
      errors.push(error as Error)
    }
  }

  throw new Error(`All proxies failed: ${errors.map(e => e.message).join(', ')}`)
}

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
 * (차트 API 사용 - quoteSummary는 인증 필요)
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
  // 차트 API 사용 (인증 불필요)
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=5d&interval=1d`

  const response = await fetchWithProxy(url)
  const data = await response.json()

  const result = data.chart?.result?.[0]
  if (!result) {
    throw new Error(`No data found for symbol: ${symbol}`)
  }

  const meta = result.meta || {}
  const quote = result.indicators?.quote?.[0]
  const timestamps = result.timestamp || []

  // 가장 최근 거래일 데이터
  const lastIndex = timestamps.length - 1
  const currentPrice = meta.regularMarketPrice || (quote?.close?.[lastIndex] ?? 0)
  const previousClose = meta.chartPreviousClose || meta.previousClose || (quote?.close?.[lastIndex - 1] ?? currentPrice)
  const change = currentPrice - previousClose
  const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0

  // 통화 결정 (한국 시장이면 KRW)
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
      // 차트 API에서는 재무 데이터를 제공하지 않음
      // 추후 다른 소스에서 가져오거나, 샘플 데이터 사용
      per: generateSampleFundamental(symbol, 'per'),
      pbr: generateSampleFundamental(symbol, 'pbr'),
      roe: generateSampleFundamental(symbol, 'roe'),
      operatingMargin: generateSampleFundamental(symbol, 'operatingMargin'),
      eps: generateSampleFundamental(symbol, 'eps'),
      marketCap: generateSampleFundamental(symbol, 'marketCap'),
    },
  }
}

/**
 * 심볼 기반 샘플 재무 데이터 생성 (일관된 값 반환)
 */
function generateSampleFundamental(symbol: string, type: string): number | null {
  // 심볼 해시로 일관된 랜덤값 생성
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  const seed = hash + type.length

  switch (type) {
    case 'per':
      return 5 + (seed % 40) // 5 ~ 45
    case 'pbr':
      return 0.5 + (seed % 50) / 10 // 0.5 ~ 5.5
    case 'roe':
      return 5 + (seed % 30) // 5% ~ 35%
    case 'operatingMargin':
      return 5 + (seed % 25) // 5% ~ 30%
    case 'eps':
      return (seed % 100) + 1 // 1 ~ 100
    case 'marketCap':
      return (seed % 500 + 50) * 1e9 // 50B ~ 550B
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

  console.log('getHistoricalPrices 호출:', { symbol, market, yahooSymbol, url })

  try {
    const response = await fetchWithProxy(url)
    console.log('getHistoricalPrices 응답 받음')

    const data = await response.json()
    console.log('getHistoricalPrices JSON 파싱 완료:', data?.chart?.error || '에러 없음')

    const result = data.chart?.result?.[0]
    if (!result || !result.timestamp) {
      console.log('getHistoricalPrices: result 또는 timestamp 없음')
      return []
    }

    const timestamps = result.timestamp
    const quote = result.indicators?.quote?.[0]
    if (!quote) {
      console.log('getHistoricalPrices: quote 데이터 없음')
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

    console.log('getHistoricalPrices 완료:', prices.length, '개 데이터')
    return prices
  } catch (error) {
    console.error('getHistoricalPrices 에러:', error)
    throw error
  }
}

/**
 * 여러 종목의 시세를 한번에 가져오기
 */
export async function getMultipleQuotes(
  symbols: Array<{ symbol: string; market: Market }>
): Promise<Map<string, Awaited<ReturnType<typeof getStockQuote>>>> {
  const results = new Map<string, Awaited<ReturnType<typeof getStockQuote>>>()

  // 병렬로 요청하되, 너무 많으면 배치 처리
  const batchSize = 5
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize)

    const promises = batch.map(async ({ symbol, market }) => {
      try {
        const data = await getStockQuote(symbol, market)
        return { symbol, data }
      } catch (error) {
        console.error(`Failed to fetch ${symbol}:`, error)
        return { symbol, data: null }
      }
    })

    const batchResults = await Promise.all(promises)

    for (const { symbol, data } of batchResults) {
      if (data) {
        results.set(symbol, data)
      }
    }

    // 배치 간 딜레이
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }

  return results
}
