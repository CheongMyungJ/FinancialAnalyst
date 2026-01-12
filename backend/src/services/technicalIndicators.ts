/**
 * 기술적 분석 지표 계산 모듈 (Backend)
 */

import type { PriceData, TechnicalData } from '../types/index.js'

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
      const slice = values.slice(0, i + 1)
      result.push(slice.reduce((a, b) => a + b, 0) / (i + 1))
    } else if (i === period - 1) {
      const slice = values.slice(0, period)
      result.push(slice.reduce((a, b) => a + b, 0) / period)
    } else {
      result.push(values[i] * multiplier + result[i - 1] * (1 - multiplier))
    }
  }
  return result
}

/**
 * RSI (상대강도지수) 계산
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
      avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period
      avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period
    } else {
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
 * 표준편차 계산
 */
export function calculateStandardDeviation(values: number[], period: number): number[] {
  const result: number[] = []
  const sma = calculateSMA(values, period)

  for (let i = 0; i < values.length; i++) {
    if (i < period - 1) {
      result.push(NaN)
    } else {
      const slice = values.slice(i - period + 1, i + 1)
      const mean = sma[i]
      const squaredDiffs = slice.map(v => Math.pow(v - mean, 2))
      const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period
      result.push(Math.sqrt(variance))
    }
  }
  return result
}

/**
 * 볼린저 밴드 계산
 * @param prices 종가 배열
 * @param period 기간 (기본 20)
 * @param multiplier 표준편차 배수 (기본 2)
 */
export function calculateBollingerBands(
  prices: number[],
  period: number = 20,
  multiplier: number = 2
): {
  upper: number[]
  middle: number[]
  lower: number[]
  width: number[]
  percentB: number[]
} {
  const middle = calculateSMA(prices, period)
  const stdDev = calculateStandardDeviation(prices, period)

  const upper: number[] = []
  const lower: number[] = []
  const width: number[] = []
  const percentB: number[] = []

  for (let i = 0; i < prices.length; i++) {
    if (isNaN(middle[i]) || isNaN(stdDev[i])) {
      upper.push(NaN)
      lower.push(NaN)
      width.push(NaN)
      percentB.push(NaN)
    } else {
      const upperBand = middle[i] + multiplier * stdDev[i]
      const lowerBand = middle[i] - multiplier * stdDev[i]
      upper.push(upperBand)
      lower.push(lowerBand)
      // 밴드폭 (%) = (상단 - 하단) / 중간 * 100
      width.push(((upperBand - lowerBand) / middle[i]) * 100)
      // %B = (현재가 - 하단) / (상단 - 하단)
      const bandRange = upperBand - lowerBand
      percentB.push(bandRange > 0 ? (prices[i] - lowerBand) / bandRange : 0.5)
    }
  }

  return { upper, middle, lower, width, percentB }
}

/**
 * MACD 계산
 */
export function calculateMACD(
  prices: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macdLine: number[]; signalLine: number[]; histogram: number[] } {
  const fastEMA = calculateEMA(prices, fastPeriod)
  const slowEMA = calculateEMA(prices, slowPeriod)

  const macdLine: number[] = []
  for (let i = 0; i < prices.length; i++) {
    if (i < slowPeriod - 1) {
      macdLine.push(NaN)
    } else {
      macdLine.push(fastEMA[i] - slowEMA[i])
    }
  }

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
      bollingerUpper: null,
      bollingerMiddle: null,
      bollingerLower: null,
      bollingerWidth: null,
      bollingerPercentB: null,
    }
  }

  const closes = prices.map(p => p.close)
  const volumes = prices.map(p => p.volume)

  const ma20Values = calculateSMA(closes, 20)
  const ma50Values = prices.length >= 50 ? calculateSMA(closes, 50) : []
  const ma120Values = prices.length >= 120 ? calculateSMA(closes, 120) : []

  const rsiValues = calculateRSI(closes, 14)
  const { macdLine, signalLine, histogram } = calculateMACD(closes)

  // 볼린저 밴드 계산
  const bollinger = calculateBollingerBands(closes, 20, 2)

  const volumeAvg20Values = calculateSMA(volumes, 20)
  const recentVolumeAvg = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5
  const volumeAvg20 = volumeAvg20Values[volumeAvg20Values.length - 1]
  const volumeChange = volumeAvg20 ? ((recentVolumeAvg - volumeAvg20) / volumeAvg20) * 100 : null

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
    bollingerUpper: bollinger.upper[lastIndex] || null,
    bollingerMiddle: bollinger.middle[lastIndex] || null,
    bollingerLower: bollinger.lower[lastIndex] || null,
    bollingerWidth: bollinger.width[lastIndex] || null,
    bollingerPercentB: bollinger.percentB[lastIndex] || null,
  }
}
