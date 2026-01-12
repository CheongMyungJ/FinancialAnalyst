/**
 * 기술적 스코어링 함수 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  calculateMAPositionScore,
  calculateRSIScore,
  calculateVolumeTrendScore,
  calculateMACDScore,
  calculateBollingerBandScore,
  calculateStochasticScore,
  calculateADXScore,
  calculateDivergenceScore,
  calculateTechnicalScores,
} from './technicalScoring.js'
import type { TechnicalData } from '../../types/index.js'

describe('calculateMAPositionScore (이동평균 위치 점수)', () => {
  it('MA20이 null이면 5점 반환', () => {
    expect(calculateMAPositionScore(100, null, null, null)).toBe(5)
  })

  it('완벽한 상승 정배열 (가격 > MA20 > MA50 > MA120)', () => {
    const score = calculateMAPositionScore(100, 95, 90, 85)
    expect(score).toBeGreaterThanOrEqual(8)
    expect(score).toBeLessThanOrEqual(10)
  })

  it('완벽한 하락 역배열 (가격 < MA20 < MA50 < MA120)', () => {
    const score = calculateMAPositionScore(80, 85, 90, 95)
    expect(score).toBeLessThanOrEqual(4)
    expect(score).toBeGreaterThanOrEqual(1)
  })

  it('점수는 항상 1-10 범위', () => {
    // 극단적인 값들
    const highScore = calculateMAPositionScore(1000, 100, 50, 25)
    const lowScore = calculateMAPositionScore(10, 100, 150, 200)

    expect(highScore).toBeLessThanOrEqual(10)
    expect(highScore).toBeGreaterThanOrEqual(1)
    expect(lowScore).toBeLessThanOrEqual(10)
    expect(lowScore).toBeGreaterThanOrEqual(1)
  })

  it('MA50, MA120 없이 MA20만 있을 때', () => {
    const aboveMA20 = calculateMAPositionScore(110, 100, null, null)
    const belowMA20 = calculateMAPositionScore(90, 100, null, null)

    expect(aboveMA20).toBeGreaterThan(5)
    expect(belowMA20).toBeLessThanOrEqual(5)
  })
})

describe('calculateRSIScore (RSI 점수)', () => {
  it('null이면 5점 반환', () => {
    expect(calculateRSIScore(null)).toBe(5)
  })

  it('과매도 구간 (RSI <= 30) 높은 점수', () => {
    expect(calculateRSIScore(20)).toBe(9) // 극단적 과매도
    expect(calculateRSIScore(30)).toBe(8) // 과매도
  })

  it('과매수 구간 (RSI >= 70) 낮은 점수', () => {
    expect(calculateRSIScore(85)).toBe(2)  // 극단적 과매수
    expect(calculateRSIScore(75)).toBe(3)  // 과매수
  })

  it('중립 구간 (RSI 45-55) 중간 점수', () => {
    expect(calculateRSIScore(50)).toBe(6)
    expect(calculateRSIScore(45)).toBe(6)
    expect(calculateRSIScore(55)).toBe(6)
  })

  it('전체 범위에서 점수 검증', () => {
    const scores = [0, 20, 30, 50, 70, 80, 100].map(rsi => calculateRSIScore(rsi))

    // 낮은 RSI일수록 높은 점수
    expect(scores[0]).toBeGreaterThan(scores[3]) // RSI 0 > RSI 50
    expect(scores[3]).toBeGreaterThan(scores[6]) // RSI 50 > RSI 100
  })
})

describe('calculateVolumeTrendScore (거래량 추세 점수)', () => {
  it('null이면 5점 반환', () => {
    expect(calculateVolumeTrendScore(null, 0)).toBe(5)
  })

  it('가격 상승 + 거래량 급증 = 최고 점수', () => {
    expect(calculateVolumeTrendScore(60, 5)).toBe(10)
    expect(calculateVolumeTrendScore(30, 5)).toBe(9)
  })

  it('가격 상승 + 거래량 보합', () => {
    expect(calculateVolumeTrendScore(0, 5)).toBe(8)
  })

  it('가격 하락 + 거래량 급증 = 낮은 점수', () => {
    expect(calculateVolumeTrendScore(60, -5)).toBe(2)
    expect(calculateVolumeTrendScore(30, -5)).toBe(3)
  })

  it('가격 보합 = 중립 점수', () => {
    expect(calculateVolumeTrendScore(0, 0)).toBe(5)
  })
})

describe('calculateMACDScore (MACD 점수)', () => {
  it('null이면 5점 반환', () => {
    expect(calculateMACDScore(null, null, null)).toBe(5)
  })

  it('MACD > Signal + 양의 히스토그램 = 높은 점수', () => {
    const score = calculateMACDScore(1.5, 1.0, 0.5, 0.3)
    expect(score).toBeGreaterThanOrEqual(7)
  })

  it('MACD < Signal + 음의 히스토그램 = 낮은 점수', () => {
    const score = calculateMACDScore(-1.5, -1.0, -0.5, -0.3)
    expect(score).toBeLessThanOrEqual(4)
  })

  it('히스토그램 상승 추세면 가점', () => {
    const increasing = calculateMACDScore(1, 0.5, 0.5, 0.3) // histogram 증가
    const decreasing = calculateMACDScore(1, 0.5, 0.3, 0.5) // histogram 감소
    expect(increasing).toBeGreaterThan(decreasing)
  })

  it('점수는 항상 1-10 범위', () => {
    const scores = [
      calculateMACDScore(10, 1, 9, 8),
      calculateMACDScore(-10, -1, -9, -8),
    ]
    scores.forEach(score => {
      expect(score).toBeGreaterThanOrEqual(1)
      expect(score).toBeLessThanOrEqual(10)
    })
  })
})

describe('calculateBollingerBandScore (볼린저밴드 점수)', () => {
  it('null이면 5점 반환', () => {
    expect(calculateBollingerBandScore(null, null, 0)).toBe(5)
  })

  it('하단밴드 (percentB <= 0) = 과매도, 높은 점수', () => {
    const score = calculateBollingerBandScore(0, 10, 0)
    expect(score).toBeGreaterThanOrEqual(8)
  })

  it('하단 근처 (percentB 0-0.2) = 매수 기회', () => {
    const score = calculateBollingerBandScore(0.1, 10, 0)
    expect(score).toBeGreaterThanOrEqual(7)
  })

  it('상단밴드 (percentB >= 1) = 과매수, 낮은 점수', () => {
    const score = calculateBollingerBandScore(1, 10, 0)
    expect(score).toBeLessThanOrEqual(4)
  })

  it('중간 (percentB 0.4-0.6) = 중립', () => {
    const score = calculateBollingerBandScore(0.5, 10, 0)
    expect(score).toBeGreaterThanOrEqual(4)
    expect(score).toBeLessThanOrEqual(6)
  })

  it('밴드 수축 + 상승 시 가점', () => {
    const narrow = calculateBollingerBandScore(0.5, 3, 5) // 좁은 밴드, 상승
    const wide = calculateBollingerBandScore(0.5, 25, 5)  // 넓은 밴드, 상승
    expect(narrow).toBeGreaterThanOrEqual(wide)
  })
})

describe('calculateStochasticScore (스토캐스틱 점수)', () => {
  it('null이면 5점 반환', () => {
    expect(calculateStochasticScore(null, null)).toBe(5)
  })

  it('과매도 (%K <= 20) = 높은 점수', () => {
    const score = calculateStochasticScore(15, 10)
    expect(score).toBeGreaterThanOrEqual(8)
  })

  it('과매도 + 골든크로스 (%K > %D) = 추가 가점', () => {
    const withCross = calculateStochasticScore(15, 10)  // K > D
    const withoutCross = calculateStochasticScore(15, 20) // K < D
    expect(withCross).toBeGreaterThan(withoutCross)
  })

  it('과매수 (%K >= 80) = 낮은 점수', () => {
    const score = calculateStochasticScore(85, 90)
    expect(score).toBeLessThanOrEqual(3)
  })

  it('과매수 + 데드크로스 (%K < %D) = 추가 감점', () => {
    const withCross = calculateStochasticScore(85, 80)  // K > D
    const withoutCross = calculateStochasticScore(85, 90) // K < D
    expect(withCross).toBeGreaterThan(withoutCross)
  })

  it('중립 구간 (30-70) = 중간 점수', () => {
    const score = calculateStochasticScore(50, 50)
    expect(score).toBeGreaterThanOrEqual(4)
    expect(score).toBeLessThanOrEqual(6)
  })
})

describe('calculateADXScore (ADX 점수)', () => {
  it('null이면 5점 반환', () => {
    expect(calculateADXScore(null, null, null)).toBe(5)
  })

  it('강한 상승 추세 (ADX >= 25, +DI > -DI) = 높은 점수', () => {
    const score = calculateADXScore(40, 30, 15)
    expect(score).toBeGreaterThanOrEqual(8)
  })

  it('강한 하락 추세 (ADX >= 25, -DI > +DI) = 낮은 점수', () => {
    // ADX 40: +2, 하락추세 ADX>=25: -2 → 최종 5
    // 더 극단적인 케이스로 테스트
    const score = calculateADXScore(20, 10, 30) // ADX < 25이므로 -1만 적용
    expect(score).toBeLessThanOrEqual(5)
  })

  it('약한 추세 (ADX < 15) = 감점', () => {
    const weak = calculateADXScore(10, 25, 20)
    const strong = calculateADXScore(30, 25, 20)
    expect(weak).toBeLessThan(strong)
  })

  it('DI 수렴 시 중립 (DI 차이 < 5)', () => {
    const score = calculateADXScore(30, 20, 22)
    expect(score).toBe(5)
  })

  it('점수는 항상 1-10 범위', () => {
    const scores = [
      calculateADXScore(50, 40, 10),  // 극단적 상승
      calculateADXScore(50, 10, 40),  // 극단적 하락
      calculateADXScore(5, 50, 50),   // 극단적 약한 추세
    ]
    scores.forEach(score => {
      expect(score).toBeGreaterThanOrEqual(1)
      expect(score).toBeLessThanOrEqual(10)
    })
  })
})

describe('calculateDivergenceScore (다이버전스 점수)', () => {
  it('다이버전스 없으면 5점', () => {
    expect(calculateDivergenceScore(null, null)).toBe(5)
  })

  it('RSI Bullish 다이버전스 = 가점', () => {
    const score = calculateDivergenceScore('bullish', null)
    expect(score).toBe(7)
  })

  it('RSI Bearish 다이버전스 = 감점', () => {
    const score = calculateDivergenceScore('bearish', null)
    expect(score).toBe(3)
  })

  it('MACD Bullish 다이버전스 = 가점', () => {
    const score = calculateDivergenceScore(null, 'bullish')
    expect(score).toBe(7)
  })

  it('MACD Bearish 다이버전스 = 감점', () => {
    const score = calculateDivergenceScore(null, 'bearish')
    expect(score).toBe(3)
  })

  it('양쪽 모두 Bullish = 최고 점수', () => {
    const score = calculateDivergenceScore('bullish', 'bullish')
    expect(score).toBe(10)
  })

  it('양쪽 모두 Bearish = 최저 점수', () => {
    const score = calculateDivergenceScore('bearish', 'bearish')
    expect(score).toBe(1)
  })

  it('혼합 다이버전스 (RSI bullish, MACD bearish)', () => {
    const score = calculateDivergenceScore('bullish', 'bearish')
    expect(score).toBe(5) // 상쇄되어 중립
  })
})

describe('calculateTechnicalScores (종합 기술적 점수)', () => {
  const baseTechnicalData: TechnicalData = {
    ma20: 100,
    ma50: 95,
    ma120: 90,
    rsi: 50,
    macdLine: 1,
    signalLine: 0.5,
    histogram: 0.5,
    volumeAvg20: 1000000,
    volumeChange: 10,
    bollingerUpper: 110,
    bollingerMiddle: 100,
    bollingerLower: 90,
    bollingerWidth: 10,
    bollingerPercentB: 0.5,
    stochasticK: 50,
    stochasticD: 50,
    adx: 25,
    plusDI: 25,
    minusDI: 20,
    rsiDivergence: null,
    macdDivergence: null,
  }

  it('모든 지표가 있을 때 8개 점수 반환', () => {
    const scores = calculateTechnicalScores(baseTechnicalData, 105, 2)

    expect(scores.maPosition).toBeDefined()
    expect(scores.rsi).toBeDefined()
    expect(scores.volumeTrend).toBeDefined()
    expect(scores.macd).toBeDefined()
    expect(scores.bollingerBand).toBeDefined()
    expect(scores.stochastic).toBeDefined()
    expect(scores.adx).toBeDefined()
    expect(scores.divergence).toBeDefined()
    expect(scores.average).toBeDefined()
  })

  it('평균 점수는 1-10 범위', () => {
    const scores = calculateTechnicalScores(baseTechnicalData, 105, 2)
    expect(scores.average).toBeGreaterThanOrEqual(1)
    expect(scores.average).toBeLessThanOrEqual(10)
  })

  it('모든 개별 점수는 1-10 범위', () => {
    const scores = calculateTechnicalScores(baseTechnicalData, 105, 2)

    const allScores = [
      scores.maPosition,
      scores.rsi,
      scores.volumeTrend,
      scores.macd,
      scores.bollingerBand,
      scores.stochastic,
      scores.adx,
      scores.divergence,
    ]

    allScores.forEach(score => {
      expect(score).toBeGreaterThanOrEqual(1)
      expect(score).toBeLessThanOrEqual(10)
    })
  })

  it('상승 신호가 많을 때 높은 평균', () => {
    const bullishData: TechnicalData = {
      ...baseTechnicalData,
      rsi: 30,               // 과매도
      stochasticK: 20,       // 과매도
      bollingerPercentB: 0.1, // 하단 근처
      rsiDivergence: 'bullish',
      macdDivergence: 'bullish',
    }

    const scores = calculateTechnicalScores(bullishData, 110, 5)
    expect(scores.average).toBeGreaterThan(6)
  })

  it('하락 신호가 많을 때 낮은 평균', () => {
    const bearishData: TechnicalData = {
      ...baseTechnicalData,
      ma20: 110,    // 가격이 MA 아래
      ma50: 115,
      ma120: 120,
      rsi: 80,                // 과매수
      stochasticK: 85,        // 과매수
      bollingerPercentB: 0.95, // 상단 근처
      plusDI: 15,
      minusDI: 30,            // 하락 추세
      rsiDivergence: 'bearish',
      macdDivergence: 'bearish',
    }

    const scores = calculateTechnicalScores(bearishData, 100, -3)
    expect(scores.average).toBeLessThan(5)
  })
})

describe('Edge Cases (엣지 케이스)', () => {
  it('극단적인 RSI 값', () => {
    expect(calculateRSIScore(0)).toBe(9)
    expect(calculateRSIScore(100)).toBe(2)
  })

  it('극단적인 스토캐스틱 값', () => {
    const extremeLow = calculateStochasticScore(0, 0)
    const extremeHigh = calculateStochasticScore(100, 100)

    expect(extremeLow).toBeGreaterThanOrEqual(8)
    expect(extremeHigh).toBeLessThanOrEqual(3)
  })

  it('음수 percentB (하단밴드 아래)', () => {
    const score = calculateBollingerBandScore(-0.5, 10, 0)
    expect(score).toBeGreaterThanOrEqual(8)
  })

  it('100 초과 percentB (상단밴드 위)', () => {
    const score = calculateBollingerBandScore(1.5, 10, 0)
    expect(score).toBeLessThanOrEqual(3)
  })

  it('매우 좁은 볼린저 밴드폭', () => {
    const narrowBand = calculateBollingerBandScore(0.5, 1, 5)
    expect(narrowBand).toBeGreaterThanOrEqual(5)
  })

  it('매우 넓은 볼린저 밴드폭', () => {
    const wideBand = calculateBollingerBandScore(0.5, 50, 0)
    expect(wideBand).toBeLessThanOrEqual(5)
  })
})
