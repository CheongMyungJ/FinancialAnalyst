/**
 * GitHub API 클라이언트
 * GitHub에 저장된 분석 결과를 가져옵니다.
 */

import type { Stock, PriceData, TechnicalScores, StockScores } from '../../types'
import { calculateAllTechnicalIndicators } from '../indicators/technicalIndicators'
import { calculateTechnicalScores } from '../scoring/technicalScoring'

// GitHub Raw 콘텐츠 URL
const GITHUB_RAW_URL = 'https://raw.githubusercontent.com/CheongMyungJ/FinancialAnalyst/main'

/**
 * 기술적 점수가 변경되었을 때 총점 재계산
 */
function recalculateTotalScore(
  originalScores: StockScores,
  newTechnicalScores: TechnicalScores
): number {
  // 기본 가중치 (totalScoring.ts와 동일)
  const weights = {
    fundamental: 0.35,
    technical: 0.30,
    news: 0.15,
    supplyDemand: 0.20,
  }

  const fundamentalScore = originalScores.fundamental.average
  const technicalScore = newTechnicalScores.average
  const newsScore = originalScores.news.average
  const supplyDemandScore = originalScores.supplyDemand.average

  const total =
    fundamentalScore * weights.fundamental +
    technicalScore * weights.technical +
    newsScore * weights.news +
    supplyDemandScore * weights.supplyDemand

  return Math.round(total * 10) / 10
}

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
 * - 기술적 지표는 가격 히스토리로부터 실시간 계산
 */
export async function fetchStockDetailFromGitHub(
  symbol: string,
  allStocks: Stock[]
): Promise<StockDetailResponse> {
  // 전체 목록에서 해당 종목 찾기
  const baseStock = allStocks.find(s => s.symbol === symbol) || null

  if (!baseStock) {
    return { stock: null, priceHistory: [] }
  }

  // 가격 히스토리 가져오기 (Yahoo Finance)
  const priceHistory = await fetchPriceHistory(symbol, baseStock.market)

  // 가격 히스토리로부터 기술적 지표 계산
  const technicals = calculateAllTechnicalIndicators(priceHistory)

  // 기술적 점수 재계산
  const technicalScores = calculateTechnicalScores(
    technicals,
    baseStock.currentPrice,
    baseStock.changePercent
  )

  // 기술적 지표와 점수를 stock 객체에 적용
  const stock: Stock = {
    ...baseStock,
    technicals: {
      ...baseStock.technicals,
      ...technicals,
    },
    scores: {
      ...baseStock.scores,
      technical: technicalScores,
      // 총점도 재계산 (기술적 점수 반영)
      total: recalculateTotalScore(baseStock.scores, technicalScores),
    },
  }

  return { stock, priceHistory }
}

/**
 * 타임아웃이 있는 fetch
 */
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
 * CORS 프록시 목록 (fallback용)
 */
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
]

/**
 * Yahoo Finance에서 가격 히스토리 가져오기
 */
async function fetchPriceHistory(symbol: string, market: string): Promise<PriceData[]> {
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
      console.log(`[Yahoo] ${symbol} 시도 ${i + 1}/${CORS_PROXIES.length}`)
      const response = await fetchWithTimeout(proxyUrl, 8000)

      if (!response.ok) {
        console.warn(`[Yahoo] ${symbol} 프록시 ${i + 1} 실패: ${response.status}`)
        continue
      }

      const data = await response.json()
      const result = data.chart?.result?.[0]

      if (!result || !result.timestamp) {
        console.warn(`[Yahoo] ${symbol} 데이터 없음`)
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
        console.log(`[Yahoo] ${symbol} 성공: ${prices.length}개 데이터`)
        return prices
      }
    } catch (error) {
      console.warn(`[Yahoo] ${symbol} 프록시 ${i + 1} 오류:`, error)
      continue
    }
  }

  console.error(`[Yahoo] ${symbol} 모든 프록시 실패`)
  return []
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
