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
 * RSI (상대강도지수) 계산 - Wilder's Smoothing Method
 */
export function calculateRSI(prices: number[], period: number = 14): number[] {
  const result: number[] = []
  const gains: number[] = []
  const losses: number[] = []

  let prevAvgGain = 0
  let prevAvgLoss = 0

  for (let i = 0; i < prices.length; i++) {
    if (i === 0) {
      result.push(NaN)
      continue
    }

    const change = prices[i] - prices[i - 1]
    const gain = change > 0 ? change : 0
    const loss = change < 0 ? Math.abs(change) : 0
    gains.push(gain)
    losses.push(loss)

    if (i < period) {
      result.push(NaN)
      continue
    }

    let avgGain: number
    let avgLoss: number

    if (i === period) {
      // 첫 번째 평균은 SMA
      avgGain = gains.reduce((a, b) => a + b, 0) / period
      avgLoss = losses.reduce((a, b) => a + b, 0) / period
    } else {
      // 이후는 Wilder's Smoothing (EMA)
      avgGain = (prevAvgGain * (period - 1) + gain) / period
      avgLoss = (prevAvgLoss * (period - 1) + loss) / period
    }

    prevAvgGain = avgGain
    prevAvgLoss = avgLoss

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
 * 스토캐스틱 계산
 * %K = (현재가 - N일 최저가) / (N일 최고가 - N일 최저가) * 100
 * %D = %K의 M일 이동평균
 */
export function calculateStochastic(
  highs: number[],
  lows: number[],
  closes: number[],
  kPeriod: number = 14,
  dPeriod: number = 3
): { k: number[]; d: number[] } {
  const k: number[] = []

  for (let i = 0; i < closes.length; i++) {
    if (i < kPeriod - 1) {
      k.push(NaN)
    } else {
      const highSlice = highs.slice(i - kPeriod + 1, i + 1)
      const lowSlice = lows.slice(i - kPeriod + 1, i + 1)
      const highestHigh = Math.max(...highSlice)
      const lowestLow = Math.min(...lowSlice)
      const range = highestHigh - lowestLow

      if (range === 0) {
        k.push(50) // 변동 없으면 중립
      } else {
        k.push(((closes[i] - lowestLow) / range) * 100)
      }
    }
  }

  // %D는 %K의 SMA
  const d = calculateSMA(k.filter(v => !isNaN(v)), dPeriod)

  // d 배열을 k와 같은 길이로 맞춤
  const dAligned: number[] = []
  let dIndex = 0
  for (let i = 0; i < k.length; i++) {
    if (isNaN(k[i])) {
      dAligned.push(NaN)
    } else {
      dAligned.push(d[dIndex] || NaN)
      dIndex++
    }
  }

  return { k, d: dAligned }
}

/**
 * ADX (Average Directional Index) 계산
 * 추세의 강도를 측정 (방향 아님)
 * ADX > 25: 강한 추세, ADX < 20: 약한 추세/횡보
 */
export function calculateADX(
  highs: number[],
  lows: number[],
  closes: number[],
  period: number = 14
): { adx: number[]; plusDI: number[]; minusDI: number[] } {
  const tr: number[] = []  // True Range
  const plusDM: number[] = [] // +DM
  const minusDM: number[] = [] // -DM

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      tr.push(highs[i] - lows[i])
      plusDM.push(0)
      minusDM.push(0)
    } else {
      // True Range
      const hl = highs[i] - lows[i]
      const hc = Math.abs(highs[i] - closes[i - 1])
      const lc = Math.abs(lows[i] - closes[i - 1])
      tr.push(Math.max(hl, hc, lc))

      // Directional Movement
      const upMove = highs[i] - highs[i - 1]
      const downMove = lows[i - 1] - lows[i]

      if (upMove > downMove && upMove > 0) {
        plusDM.push(upMove)
      } else {
        plusDM.push(0)
      }

      if (downMove > upMove && downMove > 0) {
        minusDM.push(downMove)
      } else {
        minusDM.push(0)
      }
    }
  }

  // Smoothed values
  const atr = calculateEMA(tr, period)
  const smoothedPlusDM = calculateEMA(plusDM, period)
  const smoothedMinusDM = calculateEMA(minusDM, period)

  // +DI, -DI 계산
  const plusDI: number[] = []
  const minusDI: number[] = []
  const dx: number[] = []

  for (let i = 0; i < closes.length; i++) {
    if (atr[i] === 0 || isNaN(atr[i])) {
      plusDI.push(NaN)
      minusDI.push(NaN)
      dx.push(NaN)
    } else {
      const pdi = (smoothedPlusDM[i] / atr[i]) * 100
      const mdi = (smoothedMinusDM[i] / atr[i]) * 100
      plusDI.push(pdi)
      minusDI.push(mdi)

      const diSum = pdi + mdi
      if (diSum === 0) {
        dx.push(0)
      } else {
        dx.push((Math.abs(pdi - mdi) / diSum) * 100)
      }
    }
  }

  // ADX는 DX의 EMA
  const adx = calculateEMA(dx.filter(v => !isNaN(v)), period)

  // adx를 원래 길이에 맞춤
  const adxAligned: number[] = []
  let adxIndex = 0
  for (let i = 0; i < dx.length; i++) {
    if (isNaN(dx[i])) {
      adxAligned.push(NaN)
    } else {
      adxAligned.push(adx[adxIndex] || NaN)
      adxIndex++
    }
  }

  return { adx: adxAligned, plusDI, minusDI }
}

/**
 * RSI 다이버전스 감지
 * Bullish: 가격은 신저점, RSI는 더 높음
 * Bearish: 가격은 신고점, RSI는 더 낮음
 */
export function detectRSIDivergence(
  closes: number[],
  rsiValues: number[],
  lookback: number = 14
): 'bullish' | 'bearish' | null {
  if (closes.length < lookback * 2) return null

  const recentCloses = closes.slice(-lookback)
  const previousCloses = closes.slice(-lookback * 2, -lookback)
  const recentRSI = rsiValues.slice(-lookback).filter(v => !isNaN(v))
  const previousRSI = rsiValues.slice(-lookback * 2, -lookback).filter(v => !isNaN(v))

  if (recentRSI.length === 0 || previousRSI.length === 0) return null

  const currentLow = Math.min(...recentCloses)
  const previousLow = Math.min(...previousCloses)
  const currentHigh = Math.max(...recentCloses)
  const previousHigh = Math.max(...previousCloses)

  const currentRSILow = Math.min(...recentRSI)
  const previousRSILow = Math.min(...previousRSI)
  const currentRSIHigh = Math.max(...recentRSI)
  const previousRSIHigh = Math.max(...previousRSI)

  // Bullish Divergence: 가격 신저점인데 RSI는 더 높음
  if (currentLow < previousLow && currentRSILow > previousRSILow) {
    return 'bullish'
  }

  // Bearish Divergence: 가격 신고점인데 RSI는 더 낮음
  if (currentHigh > previousHigh && currentRSIHigh < previousRSIHigh) {
    return 'bearish'
  }

  return null
}

/**
 * MACD 다이버전스 감지
 */
export function detectMACDDivergence(
  closes: number[],
  histogram: number[],
  lookback: number = 14
): 'bullish' | 'bearish' | null {
  if (closes.length < lookback * 2) return null

  const recentCloses = closes.slice(-lookback)
  const previousCloses = closes.slice(-lookback * 2, -lookback)
  const recentHist = histogram.slice(-lookback).filter(v => !isNaN(v))
  const previousHist = histogram.slice(-lookback * 2, -lookback).filter(v => !isNaN(v))

  if (recentHist.length === 0 || previousHist.length === 0) return null

  const currentLow = Math.min(...recentCloses)
  const previousLow = Math.min(...previousCloses)
  const currentHigh = Math.max(...recentCloses)
  const previousHigh = Math.max(...previousCloses)

  const currentHistLow = Math.min(...recentHist)
  const previousHistLow = Math.min(...previousHist)
  const currentHistHigh = Math.max(...recentHist)
  const previousHistHigh = Math.max(...previousHist)

  // Bullish Divergence
  if (currentLow < previousLow && currentHistLow > previousHistLow) {
    return 'bullish'
  }

  // Bearish Divergence
  if (currentHigh > previousHigh && currentHistHigh < previousHistHigh) {
    return 'bearish'
  }

  return null
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
      stochasticK: null,
      stochasticD: null,
      adx: null,
      plusDI: null,
      minusDI: null,
      rsiDivergence: null,
      macdDivergence: null,
    }
  }

  const closes = prices.map(p => p.close)
  const highs = prices.map(p => p.high)
  const lows = prices.map(p => p.low)
  const volumes = prices.map(p => p.volume)

  const ma20Values = calculateSMA(closes, 20)
  const ma50Values = prices.length >= 50 ? calculateSMA(closes, 50) : []
  const ma120Values = prices.length >= 120 ? calculateSMA(closes, 120) : []

  const rsiValues = calculateRSI(closes, 14)
  const { macdLine, signalLine, histogram } = calculateMACD(closes)

  // 볼린저 밴드 계산
  const bollinger = calculateBollingerBands(closes, 20, 2)

  // 스토캐스틱 계산
  const stochastic = calculateStochastic(highs, lows, closes, 14, 3)

  // ADX 계산
  const adxResult = calculateADX(highs, lows, closes, 14)

  // 다이버전스 감지
  const rsiDivergence = detectRSIDivergence(closes, rsiValues, 14)
  const macdDivergence = detectMACDDivergence(closes, histogram, 14)

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
    stochasticK: stochastic.k[lastIndex] || null,
    stochasticD: stochastic.d[lastIndex] || null,
    adx: adxResult.adx[lastIndex] || null,
    plusDI: adxResult.plusDI[lastIndex] || null,
    minusDI: adxResult.minusDI[lastIndex] || null,
    rsiDivergence,
    macdDivergence,
  }
}
