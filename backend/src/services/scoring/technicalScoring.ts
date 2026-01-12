/**
 * 기술적 분석 점수 계산 모듈 (Backend)
 */

import type { TechnicalData, TechnicalScores } from '../../types/index.js'

export function calculateMAPositionScore(
  currentPrice: number,
  ma20: number | null,
  ma50: number | null,
  ma120: number | null
): number {
  if (!ma20) return 5

  let score = 5

  if (currentPrice > ma20) score += 1.5
  if (ma50 && currentPrice > ma50) score += 1.5
  if (ma120 && currentPrice > ma120) score += 1

  if (ma50) {
    if (ma20 > ma50) {
      score += 0.5
    } else {
      score -= 0.5
    }
  }

  if (ma50 && ma120) {
    if (ma50 > ma120) {
      score += 0.5
    } else {
      score -= 0.5
    }
  }

  if (ma50 && ma120) {
    if (currentPrice > ma20 && ma20 > ma50 && ma50 > ma120) {
      score += 1
    } else if (currentPrice < ma20 && ma20 < ma50 && ma50 < ma120) {
      score -= 1
    }
  }

  return Math.min(10, Math.max(1, Math.round(score)))
}

export function calculateRSIScore(rsi: number | null): number {
  if (rsi === null) return 5

  if (rsi <= 20) return 9
  if (rsi <= 30) return 8
  if (rsi <= 35) return 7
  if (rsi <= 45) return 6
  if (rsi <= 55) return 6
  if (rsi <= 65) return 5
  if (rsi <= 70) return 4
  if (rsi <= 80) return 3
  return 2
}

export function calculateVolumeTrendScore(
  volumeChange: number | null,
  priceChange: number
): number {
  if (volumeChange === null) return 5

  const volumeIncreasing = volumeChange > 20
  const volumeDecreasing = volumeChange < -20
  const priceUp = priceChange > 0
  const priceDown = priceChange < 0

  if (priceUp && volumeIncreasing) {
    if (volumeChange > 50) return 10
    return 9
  }

  if (priceUp && !volumeIncreasing && !volumeDecreasing) return 8
  if (priceUp && volumeDecreasing) return 6
  if (!priceUp && !priceDown) return 5
  if (priceDown && volumeDecreasing) return 5
  if (priceDown && !volumeIncreasing && !volumeDecreasing) return 4

  if (priceDown && volumeIncreasing) {
    if (volumeChange > 50) return 2
    return 3
  }

  return 5
}

export function calculateMACDScore(
  macdLine: number | null,
  signalLine: number | null,
  histogram: number | null,
  previousHistogram?: number | null
): number {
  if (macdLine === null || signalLine === null) return 5

  let score = 5

  if (macdLine > signalLine) {
    score += 2
  } else {
    score -= 1
  }

  if (histogram !== null) {
    if (histogram > 0) {
      score += 1
    } else {
      score -= 0.5
    }

    if (previousHistogram !== null && previousHistogram !== undefined) {
      if (histogram > previousHistogram) {
        score += 1
      } else if (histogram < previousHistogram) {
        score -= 0.5
      }
    }
  }

  const crossoverStrength = Math.abs(macdLine - signalLine)
  const isCrossover = crossoverStrength < Math.abs(macdLine) * 0.1

  if (isCrossover) {
    if (macdLine > signalLine) {
      score += 1
    } else {
      score -= 1
    }
  }

  return Math.min(10, Math.max(1, Math.round(score)))
}

export function calculateTechnicalScores(
  data: TechnicalData,
  currentPrice: number,
  priceChange: number,
  previousHistogram?: number | null
): TechnicalScores {
  const maPosition = calculateMAPositionScore(
    currentPrice,
    data.ma20,
    data.ma50,
    data.ma120
  )

  const rsi = calculateRSIScore(data.rsi)
  const volumeTrend = calculateVolumeTrendScore(data.volumeChange, priceChange)
  const macd = calculateMACDScore(
    data.macdLine,
    data.signalLine,
    data.histogram,
    previousHistogram
  )

  const average = (maPosition + rsi + volumeTrend + macd) / 4

  return {
    maPosition,
    rsi,
    volumeTrend,
    macd,
    average: Math.round(average * 10) / 10,
  }
}
