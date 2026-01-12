/**
 * GitHub API 클라이언트
 * GitHub에 저장된 분석 결과를 가져옵니다.
 */

import type { Stock, PriceData } from '../../types'

// GitHub Raw 콘텐츠 URL
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/CheongMyungJ/FinancialAnalyst/main'

export interface StocksResponse {
  lastUpdated: string
  isAnalyzing: boolean
  stocks: Stock[]
}

export interface StockDetailResponse {
  stock: Stock | null
  priceHistory: PriceData[]
}

/**
 * GitHub에서 전체 종목 데이터 가져오기
 */
export async function fetchStocksFromGitHub(): Promise<StocksResponse> {
  const url = `${GITHUB_RAW_URL}/data/stocks.json?t=${Date.now()}`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('GitHub에서 데이터를 가져오는데 실패했습니다.')
  }

  return response.json()
}

/**
 * 특정 종목 상세 데이터 가져오기
 * - 기본 데이터는 전체 데이터에서 추출
 * - 가격 히스토리는 Yahoo Finance에서 직접 가져옴
 */
export async function fetchStockDetailFromGitHub(
  symbol: string,
  allStocks: Stock[]
): Promise<StockDetailResponse> {
  // 전체 목록에서 해당 종목 찾기
  const stock = allStocks.find(s => s.symbol === symbol) || null

  if (!stock) {
    return { stock: null, priceHistory: [] }
  }

  // 가격 히스토리 가져오기 (Yahoo Finance)
  const priceHistory = await fetchPriceHistory(symbol, stock.market)

  return { stock, priceHistory }
}

/**
 * Yahoo Finance에서 가격 히스토리 가져오기
 */
async function fetchPriceHistory(symbol: string, market: string): Promise<PriceData[]> {
  try {
    // 한국 종목의 경우 .KS 또는 .KQ 추가
    let yahooSymbol = symbol
    if (market === 'KOSPI') {
      yahooSymbol = `${symbol}.KS`
    } else if (market === 'KOSDAQ') {
      yahooSymbol = `${symbol}.KQ`
    }

    // CORS 우회를 위해 프록시 사용 또는 직접 호출
    // 브라우저에서 직접 Yahoo Finance API 호출은 CORS로 막힘
    // 대안: allorigins 프록시 사용
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=6mo&interval=1d`
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`

    const response = await fetch(proxyUrl)

    if (!response.ok) {
      console.warn(`[Yahoo] ${symbol} 가격 히스토리 조회 실패`)
      return []
    }

    const data = await response.json()
    const result = data.chart?.result?.[0]

    if (!result || !result.timestamp) {
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
  } catch (error) {
    console.error(`[Yahoo] ${symbol} 가격 히스토리 조회 오류:`, error)
    return []
  }
}

/**
 * 분석 상태 확인 (GitHub 기반이므로 항상 완료 상태)
 */
export function getAnalysisStatus(lastUpdated: string | null): {
  isAnalyzing: boolean
  lastUpdated: string | null
} {
  return {
    isAnalyzing: false,
    lastUpdated,
  }
}
