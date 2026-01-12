/**
 * 기본적 스코어링 함수 테스트 (Frontend)
 */

import { describe, it, expect } from 'vitest'
import {
  calculatePERScore,
  calculatePBRScore,
  calculateROEScore,
  calculateOperatingMarginScore,
  calculateDebtRatioScore,
  calculateCurrentRatioScore,
  calculateEPSGrowthScore,
  calculateRevenueGrowthScore,
  calculateFundamentalScores,
} from './fundamentalScoring'
import type { FundamentalData } from '../../types'

describe('calculatePERScore', () => {
  it('null이면 1점', () => expect(calculatePERScore(null)).toBe(1))
  it('0 이하면 1점', () => {
    expect(calculatePERScore(0)).toBe(1)
    expect(calculatePERScore(-5)).toBe(1)
  })
  it('저평가 = 높은 점수', () => expect(calculatePERScore(7)).toBe(10))
  it('고평가 = 낮은 점수', () => expect(calculatePERScore(45)).toBe(1))
  it('업종별 평균 적용', () => {
    expect(calculatePERScore(25, 'Technology')).toBe(6)
    expect(calculatePERScore(8, '은행')).toBe(6)
  })
})

describe('calculatePBRScore', () => {
  it('null이면 1점', () => expect(calculatePBRScore(null)).toBe(1))
  it('0 이하면 1점', () => expect(calculatePBRScore(0)).toBe(1))
  it('저평가 = 높은 점수', () => expect(calculatePBRScore(0.4)).toBe(10))
  it('고평가 = 낮은 점수', () => expect(calculatePBRScore(6)).toBe(1))
})

describe('calculateROEScore', () => {
  it('null이면 5점', () => expect(calculateROEScore(null)).toBe(5))
  it('음수면 1점', () => expect(calculateROEScore(-10)).toBe(1))
  it('높은 ROE = 높은 점수', () => expect(calculateROEScore(35)).toBe(10))
  it('낮은 ROE = 낮은 점수', () => expect(calculateROEScore(2)).toBe(1))
})

describe('calculateOperatingMarginScore', () => {
  it('null이면 5점', () => expect(calculateOperatingMarginScore(null)).toBe(5))
  it('음수면 1점', () => expect(calculateOperatingMarginScore(-5)).toBe(1))
  it('높은 마진 = 높은 점수', () => expect(calculateOperatingMarginScore(20)).toBe(10))
  it('업종별 평균 적용', () => {
    expect(calculateOperatingMarginScore(20, 'Technology')).toBe(6)
  })
})

describe('calculateDebtRatioScore', () => {
  it('null이면 5점', () => expect(calculateDebtRatioScore(null)).toBe(5))
  it('낮은 부채 = 높은 점수', () => expect(calculateDebtRatioScore(20)).toBe(10))
  it('높은 부채 = 낮은 점수', () => expect(calculateDebtRatioScore(600)).toBe(1))
})

describe('calculateCurrentRatioScore', () => {
  it('null이면 5점', () => expect(calculateCurrentRatioScore(null)).toBe(5))
  it('높은 유동비율 = 높은 점수', () => expect(calculateCurrentRatioScore(200)).toBe(10))
  it('낮은 유동비율 = 낮은 점수', () => expect(calculateCurrentRatioScore(15)).toBe(1))
  it('과잉 유동성은 최적 아님', () => {
    expect(calculateCurrentRatioScore(350)).toBeLessThan(calculateCurrentRatioScore(200))
  })
})

describe('calculateEPSGrowthScore', () => {
  it('null이면 5점', () => expect(calculateEPSGrowthScore(null)).toBe(5))
  it('고성장 = 높은 점수', () => expect(calculateEPSGrowthScore(55)).toBe(10))
  it('감소 = 낮은 점수', () => expect(calculateEPSGrowthScore(-25)).toBe(1))
})

describe('calculateRevenueGrowthScore', () => {
  it('null이면 5점', () => expect(calculateRevenueGrowthScore(null)).toBe(5))
  it('고성장 = 높은 점수', () => expect(calculateRevenueGrowthScore(45)).toBe(10))
  it('감소 = 낮은 점수', () => expect(calculateRevenueGrowthScore(-25)).toBe(1))
})

describe('calculateFundamentalScores', () => {
  const baseData: FundamentalData = {
    per: 15,
    pbr: 1.5,
    roe: 15,
    operatingMargin: 10,
    eps: 5000,
    marketCap: 100000000000,
    debtRatio: 100,
    currentRatio: 150,
    epsGrowth: 10,
    revenueGrowth: 10,
  }

  it('모든 점수 반환', () => {
    const scores = calculateFundamentalScores(baseData)
    expect(scores.per).toBeDefined()
    expect(scores.pbr).toBeDefined()
    expect(scores.roe).toBeDefined()
    expect(scores.average).toBeDefined()
  })

  it('평균은 1-10 범위', () => {
    const scores = calculateFundamentalScores(baseData)
    expect(scores.average).toBeGreaterThanOrEqual(1)
    expect(scores.average).toBeLessThanOrEqual(10)
  })

  it('업종 파라미터 전달', () => {
    const scores1 = calculateFundamentalScores(baseData)
    const scores2 = calculateFundamentalScores(baseData, 'Technology')
    expect(scores1.per).not.toBe(scores2.per)
  })
})
