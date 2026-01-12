/**
 * 백테스트용 가격 데이터 API
 */

import type { PriceData } from '../../types'

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
]

async function fetchWithTimeout(url: string, timeout: number = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { signal: controller.signal })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * Yahoo Finance에서 백테스트용 가격 히스토리 가져오기 (6개월)
 */
export async function fetchPriceHistoryForBacktest(
  symbol: string,
  market: string
): Promise<PriceData[]> {
  // 한국 종목의 경우 .KS 또는 .KQ 추가
  let yahooSymbol = symbol
  if (market === 'KOSPI') {
    yahooSymbol = `${symbol}.KS`
  } else if (market === 'KOSDAQ') {
    yahooSymbol = `${symbol}.KQ`
  }

  const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=6mo&interval=1d`

  // 여러 프록시로 시도
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxyUrl = CORS_PROXIES[i](yahooUrl)

    try {
      const response = await fetchWithTimeout(proxyUrl, 8000)

      if (!response.ok) {
        continue
      }

      const data = await response.json()
      const result = data.chart?.result?.[0]

      if (!result || !result.timestamp) {
        continue
      }

      const timestamps = result.timestamp
      const quote = result.indicators?.quote?.[0]

      if (!quote) {
        continue
      }

      const prices: PriceData[] = []
      for (let j = 0; j < timestamps.length; j++) {
        if (
          quote.open?.[j] != null &&
          quote.high?.[j] != null &&
          quote.low?.[j] != null &&
          quote.close?.[j] != null &&
          quote.volume?.[j] != null
        ) {
          prices.push({
            date: new Date(timestamps[j] * 1000).toISOString().split('T')[0],
            open: quote.open[j],
            high: quote.high[j],
            low: quote.low[j],
            close: quote.close[j],
            volume: quote.volume[j],
          })
        }
      }

      if (prices.length > 0) {
        return prices
      }
    } catch (error) {
      continue
    }
  }

  return []
}
