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

/**
 * 볼린저 밴드 점수 계산
 * %B: 0 = 하단밴드, 0.5 = 중간, 1 = 상단밴드
 * 밴드폭: 변동성 지표
 */
export function calculateBollingerBandScore(
  percentB: number | null,
  bollingerWidth: number | null,
  priceChange: number
): number {
  if (percentB === null) return 5

  let score = 5

  // %B 기반 점수 (과매수/과매도)
  if (percentB <= 0) {
    // 하단 밴드 이하 - 과매도 (매수 기회)
    score += 3
  } else if (percentB <= 0.2) {
    // 하단 근처 - 과매도 가능성
    score += 2
  } else if (percentB <= 0.4) {
    score += 1
  } else if (percentB >= 1) {
    // 상단 밴드 이상 - 과매수 (조정 가능성)
    score -= 2
  } else if (percentB >= 0.8) {
    // 상단 근처 - 과매수 가능성
    score -= 1
  }

  // 밴드폭 기반 추가 점수 (변동성)
  if (bollingerWidth !== null) {
    if (bollingerWidth < 5) {
      // 밴드 수축 - 변동성 확대 예고 (돌파 가능성)
      // 주가 방향에 따라 점수 조정
      if (priceChange > 0) {
        score += 1  // 상승 돌파 가능성
      }
    } else if (bollingerWidth > 20) {
      // 밴드 확대 - 높은 변동성 (리스크)
      score -= 0.5
    }
  }

  return Math.min(10, Math.max(1, Math.round(score)))
}

/**
 * 스토캐스틱 점수 계산
 * %K: 현재 위치 (0-100)
 * %D: %K의 이동평균
 * 20 이하: 과매도, 80 이상: 과매수
 */
export function calculateStochasticScore(
  stochasticK: number | null,
  stochasticD: number | null
): number {
  if (stochasticK === null) return 5

  let score = 5

  // 과매도/과매수 영역
  if (stochasticK <= 20) {
    // 과매도 - 매수 신호
    score += 3
    // %K가 %D를 상향 돌파하면 추가 점수
    if (stochasticD !== null && stochasticK > stochasticD) {
      score += 1
    }
  } else if (stochasticK <= 30) {
    score += 2
  } else if (stochasticK <= 40) {
    score += 1
  } else if (stochasticK >= 80) {
    // 과매수 - 매도 신호
    score -= 2
    // %K가 %D를 하향 돌파하면 추가 감점
    if (stochasticD !== null && stochasticK < stochasticD) {
      score -= 1
    }
  } else if (stochasticK >= 70) {
    score -= 1
  }

  // %K와 %D의 교차 (중립 구간에서도)
  if (stochasticD !== null && stochasticK > 30 && stochasticK < 70) {
    if (stochasticK > stochasticD) {
      score += 0.5  // 골든 크로스 경향
    } else if (stochasticK < stochasticD) {
      score -= 0.5  // 데드 크로스 경향
    }
  }

  return Math.min(10, Math.max(1, Math.round(score)))
}

/**
 * ADX 점수 계산
 * ADX: 추세 강도 (방향 무관)
 * +DI, -DI: 방향 지표
 * ADX > 25: 강한 추세, ADX < 20: 약한 추세/횡보
 */
export function calculateADXScore(
  adx: number | null,
  plusDI: number | null,
  minusDI: number | null
): number {
  if (adx === null) return 5

  let score = 5

  // 추세 강도에 따른 기본 점수
  if (adx >= 40) {
    // 매우 강한 추세
    score += 2
  } else if (adx >= 25) {
    // 강한 추세
    score += 1
  } else if (adx < 15) {
    // 매우 약한 추세/횡보
    score -= 1
  }

  // +DI, -DI로 방향 판단 후 점수 조정
  if (plusDI !== null && minusDI !== null) {
    if (plusDI > minusDI) {
      // 상승 추세
      if (adx >= 25) {
        score += 2  // 강한 상승 추세
      } else {
        score += 1  // 약한 상승 추세
      }
    } else if (minusDI > plusDI) {
      // 하락 추세
      if (adx >= 25) {
        score -= 2  // 강한 하락 추세
      } else {
        score -= 1  // 약한 하락 추세
      }
    }

    // DI 교차 근접 여부 (추세 전환 가능성)
    const diDiff = Math.abs(plusDI - minusDI)
    if (diDiff < 5) {
      // DI가 수렴 중 - 추세 전환 가능성
      score = 5  // 중립으로
    }
  }

  return Math.min(10, Math.max(1, Math.round(score)))
}

/**
 * 다이버전스 점수 계산
 * RSI/MACD 다이버전스는 추세 전환의 강력한 신호
 */
export function calculateDivergenceScore(
  rsiDivergence: 'bullish' | 'bearish' | null,
  macdDivergence: 'bullish' | 'bearish' | null
): number {
  let score = 5

  // RSI 다이버전스
  if (rsiDivergence === 'bullish') {
    score += 2  // 상승 전환 신호
  } else if (rsiDivergence === 'bearish') {
    score -= 2  // 하락 전환 신호
  }

  // MACD 다이버전스
  if (macdDivergence === 'bullish') {
    score += 2  // 상승 전환 신호
  } else if (macdDivergence === 'bearish') {
    score -= 2  // 하락 전환 신호
  }

  // 두 다이버전스가 같은 방향이면 강력한 신호
  if (rsiDivergence === 'bullish' && macdDivergence === 'bullish') {
    score += 1  // 추가 가점
  } else if (rsiDivergence === 'bearish' && macdDivergence === 'bearish') {
    score -= 1  // 추가 감점
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
  const bollingerBand = calculateBollingerBandScore(
    data.bollingerPercentB,
    data.bollingerWidth,
    priceChange
  )
  const stochastic = calculateStochasticScore(
    data.stochasticK,
    data.stochasticD
  )
  const adx = calculateADXScore(
    data.adx,
    data.plusDI,
    data.minusDI
  )
  const divergence = calculateDivergenceScore(
    data.rsiDivergence,
    data.macdDivergence
  )

  const average = (maPosition + rsi + volumeTrend + macd + bollingerBand + stochastic + adx + divergence) / 8

  return {
    maPosition,
    rsi,
    volumeTrend,
    macd,
    bollingerBand,
    stochastic,
    adx,
    divergence,
    average: Math.round(average * 10) / 10,
  }
}
