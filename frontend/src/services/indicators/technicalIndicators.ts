/**
 * 기술적 분석 지표 계산 모듈
 * RSI, MACD, 이동평균선 등의 기술적 지표를 계산합니다.
 */

import type { PriceData, TechnicalData } from '../../types'

/**
 * 단순 이동평균 (SMA) 계산
 */
export function calculateSMA(values: number[], period: number): number[] {
  const result: number[] = []
  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(NaN)
    } else {
      const slice = values.slice(i - period + 1, i + 1)
      result.push(slice.reduce((a, b) => a + b, 0) / period)
    }
  }
  return result
}

/**
 * 지수 이동평균 (EMA) 계산
 */
export function calculateEMA(values: number[], period: number): number[] {
  const result: number[] = []
  const multiplier = 2 / (period + 1)

  for (let i = 0; i < values.length; i++) {
    if (i === 0) {
      result.push(values[0])
    } else if (i < period - 1) {
      // SMA로 시작
      const slice = values.slice(0, i + 1)
      result.push(slice.reduce((a, b) => a + b, 0) / (i + 1))
    } else if (i === period - 1) {
      // 첫 번째 EMA = SMA
      const slice = values.slice(0, period)
      result.push(slice.reduce((a, b) => a + b, 0) / period)
    } else {
      // EMA = (Current Price * Multiplier) + (Previous EMA * (1 - Multiplier))
      result.push(values[i] * multiplier + result[i - 1] * (1 - multiplier))
    }
  }
  return result
}

/**
 * RSI (상대강도지수) 계산
 * @param prices 종가 배열
 * @param period 기간 (기본값: 14)
 */
export function calculateRSI(prices: number[], period: number = 14): number[] {
  const result: number[] = []
  const gains: number[] = []
  const losses: number[] = []

  for (let i = 0; i < prices.length; i++) {
    if (i === 0) {
      result.push(NaN)
      continue
    }

    const change = prices[i] - prices[i - 1]
    gains.push(change > 0 ? change : 0)
    losses.push(change < 0 ? Math.abs(change) : 0)

    if (i < period) {
      result.push(NaN)
      continue
    }

    let avgGain: number
    let avgLoss: number

    if (i === period) {
      // 첫 번째 RSI 계산 (단순 평균)
      avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period
      avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period
    } else {
      // 스무딩된 평균
      const prevAvgGain = result[i - 1] !== 50
        ? (100 - result[i - 1]) / result[i - 1] * (losses.slice(-period - 1, -1).reduce((a, b) => a + b, 0) / period)
        : gains.slice(-period - 1, -1).reduce((a, b) => a + b, 0) / period
      const prevAvgLoss = losses.slice(-period - 1, -1).reduce((a, b) => a + b, 0) / period

      avgGain = (prevAvgGain * (period - 1) + gains[gains.length - 1]) / period
      avgLoss = (prevAvgLoss * (period - 1) + losses[losses.length - 1]) / period
    }

    if (avgLoss === 0) {
      result.push(100)
    } else {
      const rs = avgGain / avgLoss
      result.push(100 - 100 / (1 + rs))
    }
  }

  return result
}

/**
 * MACD 계산
 * @param prices 종가 배열
 * @param fastPeriod 빠른 EMA 기간 (기본값: 12)
 * @param slowPeriod 느린 EMA 기간 (기본값: 26)
 * @param signalPeriod 시그널 라인 기간 (기본값: 9)
 */
export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macdLine: number[]; signalLine: number[]; histogram: number[] } {
  const fastEMA = calculateEMA(prices, fastPeriod)
  const slowEMA = calculateEMA(prices, slowPeriod)

  // MACD 라인 = Fast EMA - Slow EMA
  const macdLine: number[] = []
  for (let i = 0; i < prices.length; i++) {
    if (i < slowPeriod - 1) {
      macdLine.push(NaN)
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i])
    }
  }

  // 시그널 라인 = MACD의 EMA
  const validMacd = macdLine.filter(v => !isNaN(v))
  const signalEMA = calculateEMA(validMacd, signalPeriod)

  const signalLine: number[] = []
  let signalIndex = 0
  for (let i = 0; i < prices.length; i++) {
    if (isNaN(macdLine[i])) {
      signalLine.push(NaN)
    } else {
      signalLine.push(signalEMA[signalIndex] || NaN)
      signalIndex++
    }
  }

  // 히스토그램 = MACD 라인 - 시그널 라인
  const histogram: number[] = []
  for (let i = 0; i < prices.length; i++) {
    if (isNaN(macdLine[i]) || isNaN(signalLine[i])) {
      histogram.push(NaN)
    } else {
      histogram.push(macdLine[i] - signalLine[i])
    }
  }

  return { macdLine, signalLine, histogram }
}

/**
 * 가격 데이터에서 전체 기술적 지표 계산
 */
export function calculateAllTechnicalIndicators(prices: PriceData[]): TechnicalData {
  if (prices.length < 30) {
    return {
      ma20: null,
      ma50: null,
      ma120: null,
      rsi: null,
      macdLine: null,
      signalLine: null,
      histogram: null,
      volumeAvg20: null,
      volumeChange: null,
    }
  }

  const closes = prices.map(p => p.close)
  const volumes = prices.map(p => p.volume)

  // 이동평균
  const ma20Values = calculateSMA(closes, 20)
  const ma50Values = prices.length >= 50 ? calculateSMA(closes, 50) : []
  const ma120Values = prices.length >= 120 ? calculateSMA(closes, 120) : []

  // RSI
  const rsiValues = calculateRSI(closes, 14)

  // MACD
  const { macdLine, signalLine, histogram } = calculateMACD(closes)

  // 거래량 분석
  const volumeAvg20Values = calculateSMA(volumes, 20)
  const recentVolumeAvg = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5
  const volumeAvg20 = volumeAvg20Values[volumeAvg20Values.length - 1]
  const volumeChange = volumeAvg20 ? ((recentVolumeAvg - volumeAvg20) / volumeAvg20) * 100 : null

  // 마지막 값 반환
  const lastIndex = closes.length - 1

  return {
    ma20: ma20Values[lastIndex] || null,
    ma50: ma50Values[lastIndex] || null,
    ma120: ma120Values[lastIndex] || null,
    rsi: rsiValues[lastIndex] || null,
    macdLine: macdLine[lastIndex] || null,
    signalLine: signalLine[lastIndex] || null,
    histogram: histogram[lastIndex] || null,
    volumeAvg20,
    volumeChange,
  }
}

/**
 * 이동평균선 배열 상태 확인
 * @returns 정배열이면 true, 역배열이면 false
 */
export function checkMAAlignment(
  currentPrice: number,
  ma20: number | null,
  ma50: number | null,
  ma120: number | null
): 'bullish' | 'bearish' | 'neutral' {
  if (!ma20 || !ma50) return 'neutral'

  // 정배열: 현재가 > MA20 > MA50 > MA120
  if (ma120) {
    if (currentPrice > ma20 && ma20 > ma50 && ma50 > ma120) {
      return 'bullish'
    }
    if (currentPrice < ma20 && ma20 < ma50 && ma50 < ma120) {
      return 'bearish'
    }
  } else {
    if (currentPrice > ma20 && ma20 > ma50) {
      return 'bullish'
    }
    if (currentPrice < ma20 && ma20 < ma50) {
      return 'bearish'
    }
  }

  return 'neutral'
}
