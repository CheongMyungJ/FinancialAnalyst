/**
 * Backend API 클라이언트
 * 백엔드 서버에서 분석된 데이터를 가져옵니다.
 */

import type { Stock, PriceData } from '../../types'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'

export interface StocksResponse {
  lastUpdated: string
  isAnalyzing: boolean
  stocks: Stock[]
}

export interface StockDetailResponse {
  stock: Stock
  priceHistory: PriceData[]
}

export interface AnalysisStatus {
  isAnalyzing: boolean
  lastUpdated: string | null
}

/**
 * 전체 종목 데이터 가져오기
 */
export async function fetchStocks(): Promise<StocksResponse> {
  const response = await fetch(`${BACKEND_URL}/api/stocks`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || '데이터를 가져오는데 실패했습니다.')
  }

  return response.json()
}

/**
 * 특정 종목 상세 데이터 가져오기
 */
export async function fetchStockDetail(symbol: string): Promise<StockDetailResponse> {
  const response = await fetch(`${BACKEND_URL}/api/stocks/${symbol}`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || '종목 데이터를 가져오는데 실패했습니다.')
  }

  return response.json()
}

/**
 * 분석 상태 확인
 */
export async function fetchAnalysisStatus(): Promise<AnalysisStatus> {
  const response = await fetch(`${BACKEND_URL}/api/stocks/status`)

  if (!response.ok) {
    throw new Error('상태를 확인하는데 실패했습니다.')
  }

  return response.json()
}

/**
 * 수동 분석 요청
 */
export async function requestRefresh(): Promise<{ message: string; isAnalyzing: boolean }> {
  const response = await fetch(`${BACKEND_URL}/api/stocks/refresh`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || '분석 요청에 실패했습니다.')
  }

  return response.json()
}
