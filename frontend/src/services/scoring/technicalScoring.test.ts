/**
 * 기술적 스코어링 함수 테스트 (Frontend)
 */

import { describe, it, expect } from 'vitest'
import {
  calculateMAPositionScore,
  calculateRSIScore,
  calculateMACDScore,
  calculateBollingerBandScore,
  calculateStochasticScore,
  calculateADXScore,
  calculateDivergenceScore,
} from './technicalScoring'

describe('calculateMAPositionScore', () => {
  it('MA20이 null이면 5점 반환', () => {
    expect(calculateMAPositionScore(100, null, null, null)).toBe(5)
  })

  it('완벽한 상승 정배열 = 높은 점수', () => {
    const score = calculateMAPositionScore(100, 95, 90, 85)
    expect(score).toBeGreaterThanOrEqual(8)
  })

  it('완벽한 하락 역배열 = 낮은 점수', () => {
    const score = calculateMAPositionScore(80, 85, 90, 95)
    expect(score).toBeLessThanOrEqual(4)
  })

  it('점수는 항상 1-10 범위', () => {
    const high = calculateMAPositionScore(1000, 100, 50, 25)
    const low = calculateMAPositionScore(10, 100, 150, 200)
    expect(high).toBeLessThanOrEqual(10)
    expect(low).toBeGreaterThanOrEqual(1)
  })
})

describe('calculateRSIScore', () => {
  it('null이면 5점', () => expect(calculateRSIScore(null)).toBe(5))
  it('과매도 = 높은 점수', () => expect(calculateRSIScore(20)).toBeGreaterThanOrEqual(8))
  it('과매수 = 낮은 점수', () => expect(calculateRSIScore(80)).toBeLessThanOrEqual(3))
  it('중립 = 중간 점수', () => expect(calculateRSIScore(50)).toBe(6))
})

describe('calculateMACDScore', () => {
  it('null이면 5점', () => expect(calculateMACDScore(null, null, null)).toBe(5))

  it('MACD > Signal = 높은 점수', () => {
    const score = calculateMACDScore(1.5, 1.0, 0.5, 0.3)
    expect(score).toBeGreaterThanOrEqual(7)
  })

  it('MACD < Signal = 낮은 점수', () => {
    const score = calculateMACDScore(-1.5, -1.0, -0.5, -0.3)
    expect(score).toBeLessThanOrEqual(4)
  })
})

describe('calculateBollingerBandScore', () => {
  it('null이면 5점', () => expect(calculateBollingerBandScore(null, null, 0)).toBe(5))
  it('하단밴드 = 높은 점수', () => expect(calculateBollingerBandScore(0, 10, 0)).toBeGreaterThanOrEqual(8))
  it('상단밴드 = 낮은 점수', () => expect(calculateBollingerBandScore(1, 10, 0)).toBeLessThanOrEqual(4))
})

describe('calculateStochasticScore', () => {
  it('null이면 5점', () => expect(calculateStochasticScore(null, null)).toBe(5))
  it('과매도 = 높은 점수', () => expect(calculateStochasticScore(15, 10)).toBeGreaterThanOrEqual(8))
  it('과매수 = 낮은 점수', () => expect(calculateStochasticScore(85, 90)).toBeLessThanOrEqual(3))
})

describe('calculateADXScore', () => {
  it('null이면 5점', () => expect(calculateADXScore(null, null, null)).toBe(5))
  it('강한 상승 = 높은 점수', () => expect(calculateADXScore(40, 30, 15)).toBeGreaterThanOrEqual(8))
  it('DI 수렴 시 중립', () => expect(calculateADXScore(30, 20, 22)).toBe(5))
})

describe('calculateDivergenceScore', () => {
  it('다이버전스 없으면 5점', () => expect(calculateDivergenceScore(null, null)).toBe(5))
  it('양쪽 Bullish = 최고 점수', () => expect(calculateDivergenceScore('bullish', 'bullish')).toBe(10))
  it('양쪽 Bearish = 최저 점수', () => expect(calculateDivergenceScore('bearish', 'bearish')).toBe(1))
})
