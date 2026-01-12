/**
 * 테스트용 샘플 데이터
 */

import type { PriceData } from '../../types/index.js'

/**
 * 가격 데이터 생성 함수
 */
export function generatePriceData(
  days: number,
  startPrice: number = 100,
  volatility: number = 0.02,
  trend: 'up' | 'down' | 'flat' = 'flat'
): PriceData[] {
  const data: PriceData[] = []
  let price = startPrice

  for (let i = 0; i < days; i++) {
    const date = new Date(2024, 0, 2 + i)

    // 트렌드에 따른 기본 변화
    let trendChange = 0
    if (trend === 'up') trendChange = startPrice * 0.003
    else if (trend === 'down') trendChange = -startPrice * 0.003

    // 랜덤 변동
    const randomChange = (Math.random() - 0.5) * 2 * volatility * price
    const change = trendChange + randomChange

    const close = price + change
    const high = close + Math.random() * volatility * price
    const low = close - Math.random() * volatility * price
    const volume = Math.floor(1000000 + Math.random() * 500000)

    data.push({
      date: date.toISOString().split('T')[0],
      open: price,
      high: Math.max(price, close, high),
      low: Math.min(price, close, low),
      close,
      volume,
    })

    price = close
  }

  return data
}

/**
 * 단순 상승 가격 데이터 (테스트용)
 */
export function generateUpTrendPrices(days: number, startPrice: number = 100): number[] {
  return Array.from({ length: days }, (_, i) => startPrice + i)
}

/**
 * 단순 하락 가격 데이터 (테스트용)
 */
export function generateDownTrendPrices(days: number, startPrice: number = 100): number[] {
  return Array.from({ length: days }, (_, i) => startPrice - i)
}

/**
 * 일정한 가격 데이터 (테스트용)
 */
export function generateFlatPrices(days: number, price: number = 100): number[] {
  return Array(days).fill(price)
}

/**
 * 사인파 가격 데이터 (진동 테스트용)
 */
export function generateSinePrices(
  days: number,
  basePrice: number = 100,
  amplitude: number = 10
): number[] {
  return Array.from({ length: days }, (_, i) =>
    basePrice + amplitude * Math.sin(i * 0.3)
  )
}

/**
 * OHLCV 데이터 생성 (지정된 종가 배열로부터)
 */
export function createOHLCVFromCloses(closes: number[]): {
  highs: number[]
  lows: number[]
  volumes: number[]
} {
  const highs = closes.map(c => c * 1.02)
  const lows = closes.map(c => c * 0.98)
  const volumes = closes.map(() => 1000000)
  return { highs, lows, volumes }
}

/**
 * 실제 주가와 유사한 60일 테스트 데이터
 */
export const SAMPLE_60_DAYS: PriceData[] = [
  { date: '2024-01-02', open: 100.00, high: 101.50, low: 99.50, close: 101.00, volume: 1000000 },
  { date: '2024-01-03', open: 101.00, high: 102.00, low: 100.50, close: 101.50, volume: 1100000 },
  { date: '2024-01-04', open: 101.50, high: 103.00, low: 101.00, close: 102.50, volume: 1200000 },
  { date: '2024-01-05', open: 102.50, high: 103.50, low: 101.50, close: 102.00, volume: 900000 },
  { date: '2024-01-08', open: 102.00, high: 102.50, low: 100.00, close: 100.50, volume: 1300000 },
  { date: '2024-01-09', open: 100.50, high: 101.00, low: 99.00, close: 99.50, volume: 1400000 },
  { date: '2024-01-10', open: 99.50, high: 100.50, low: 98.50, close: 100.00, volume: 1100000 },
  { date: '2024-01-11', open: 100.00, high: 101.50, low: 99.50, close: 101.00, volume: 1000000 },
  { date: '2024-01-12', open: 101.00, high: 102.00, low: 100.00, close: 101.50, volume: 950000 },
  { date: '2024-01-15', open: 101.50, high: 103.00, low: 101.00, close: 102.50, volume: 1050000 },
  { date: '2024-01-16', open: 102.50, high: 104.00, low: 102.00, close: 103.50, volume: 1150000 },
  { date: '2024-01-17', open: 103.50, high: 105.00, low: 103.00, close: 104.50, volume: 1250000 },
  { date: '2024-01-18', open: 104.50, high: 105.50, low: 103.50, close: 104.00, volume: 1000000 },
  { date: '2024-01-19', open: 104.00, high: 104.50, low: 102.50, close: 103.00, volume: 1100000 },
  { date: '2024-01-22', open: 103.00, high: 103.50, low: 101.50, close: 102.00, volume: 1200000 },
  { date: '2024-01-23', open: 102.00, high: 103.00, low: 101.00, close: 102.50, volume: 900000 },
  { date: '2024-01-24', open: 102.50, high: 104.00, low: 102.00, close: 103.50, volume: 1050000 },
  { date: '2024-01-25', open: 103.50, high: 105.00, low: 103.00, close: 104.50, volume: 1100000 },
  { date: '2024-01-26', open: 104.50, high: 106.00, low: 104.00, close: 105.50, volume: 1200000 },
  { date: '2024-01-29', open: 105.50, high: 107.00, low: 105.00, close: 106.50, volume: 1300000 },
  { date: '2024-01-30', open: 106.50, high: 108.00, low: 106.00, close: 107.50, volume: 1400000 },
  { date: '2024-01-31', open: 107.50, high: 108.50, low: 106.50, close: 107.00, volume: 1100000 },
  { date: '2024-02-01', open: 107.00, high: 107.50, low: 105.50, close: 106.00, volume: 1200000 },
  { date: '2024-02-02', open: 106.00, high: 107.00, low: 105.00, close: 106.50, volume: 1000000 },
  { date: '2024-02-05', open: 106.50, high: 108.00, low: 106.00, close: 107.50, volume: 1050000 },
  { date: '2024-02-06', open: 107.50, high: 109.00, low: 107.00, close: 108.50, volume: 1150000 },
  { date: '2024-02-07', open: 108.50, high: 110.00, low: 108.00, close: 109.50, volume: 1250000 },
  { date: '2024-02-08', open: 109.50, high: 111.00, low: 109.00, close: 110.50, volume: 1350000 },
  { date: '2024-02-09', open: 110.50, high: 111.50, low: 109.50, close: 110.00, volume: 1100000 },
  { date: '2024-02-12', open: 110.00, high: 110.50, low: 108.50, close: 109.00, volume: 1200000 },
  { date: '2024-02-13', open: 109.00, high: 110.00, low: 108.00, close: 109.50, volume: 1000000 },
  { date: '2024-02-14', open: 109.50, high: 111.00, low: 109.00, close: 110.50, volume: 1100000 },
  { date: '2024-02-15', open: 110.50, high: 112.00, low: 110.00, close: 111.50, volume: 1200000 },
  { date: '2024-02-16', open: 111.50, high: 113.00, low: 111.00, close: 112.50, volume: 1300000 },
  { date: '2024-02-19', open: 112.50, high: 114.00, low: 112.00, close: 113.50, volume: 1400000 },
  { date: '2024-02-20', open: 113.50, high: 115.00, low: 113.00, close: 114.50, volume: 1500000 },
  { date: '2024-02-21', open: 114.50, high: 115.50, low: 113.50, close: 114.00, volume: 1200000 },
  { date: '2024-02-22', open: 114.00, high: 114.50, low: 112.50, close: 113.00, volume: 1300000 },
  { date: '2024-02-23', open: 113.00, high: 114.00, low: 112.00, close: 113.50, volume: 1100000 },
  { date: '2024-02-26', open: 113.50, high: 115.00, low: 113.00, close: 114.50, volume: 1200000 },
  { date: '2024-02-27', open: 114.50, high: 116.00, low: 114.00, close: 115.50, volume: 1300000 },
  { date: '2024-02-28', open: 115.50, high: 117.00, low: 115.00, close: 116.50, volume: 1400000 },
  { date: '2024-02-29', open: 116.50, high: 118.00, low: 116.00, close: 117.50, volume: 1500000 },
  { date: '2024-03-01', open: 117.50, high: 119.00, low: 117.00, close: 118.50, volume: 1600000 },
  { date: '2024-03-04', open: 118.50, high: 119.50, low: 117.50, close: 118.00, volume: 1300000 },
  { date: '2024-03-05', open: 118.00, high: 118.50, low: 116.50, close: 117.00, volume: 1400000 },
  { date: '2024-03-06', open: 117.00, high: 118.00, low: 116.00, close: 117.50, volume: 1200000 },
  { date: '2024-03-07', open: 117.50, high: 119.00, low: 117.00, close: 118.50, volume: 1300000 },
  { date: '2024-03-08', open: 118.50, high: 120.00, low: 118.00, close: 119.50, volume: 1400000 },
  { date: '2024-03-11', open: 119.50, high: 121.00, low: 119.00, close: 120.50, volume: 1500000 },
  { date: '2024-03-12', open: 120.50, high: 122.00, low: 120.00, close: 121.50, volume: 1600000 },
  { date: '2024-03-13', open: 121.50, high: 123.00, low: 121.00, close: 122.50, volume: 1700000 },
  { date: '2024-03-14', open: 122.50, high: 124.00, low: 122.00, close: 123.50, volume: 1800000 },
  { date: '2024-03-15', open: 123.50, high: 124.50, low: 122.50, close: 123.00, volume: 1500000 },
  { date: '2024-03-18', open: 123.00, high: 123.50, low: 121.50, close: 122.00, volume: 1600000 },
  { date: '2024-03-19', open: 122.00, high: 123.00, low: 121.00, close: 122.50, volume: 1400000 },
  { date: '2024-03-20', open: 122.50, high: 124.00, low: 122.00, close: 123.50, volume: 1500000 },
  { date: '2024-03-21', open: 123.50, high: 125.00, low: 123.00, close: 124.50, volume: 1600000 },
  { date: '2024-03-22', open: 124.50, high: 126.00, low: 124.00, close: 125.50, volume: 1700000 },
]

// 60일 데이터에서 추출한 종가 배열
export const SAMPLE_CLOSES = SAMPLE_60_DAYS.map(p => p.close)
export const SAMPLE_HIGHS = SAMPLE_60_DAYS.map(p => p.high)
export const SAMPLE_LOWS = SAMPLE_60_DAYS.map(p => p.low)
export const SAMPLE_VOLUMES = SAMPLE_60_DAYS.map(p => p.volume)
