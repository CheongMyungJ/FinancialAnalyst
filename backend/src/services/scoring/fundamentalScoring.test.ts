/**
 * 기본적 스코어링 함수 테스트
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
} from './fundamentalScoring.js'
import type { FundamentalData } from '../../types/index.js'

describe('calculatePERScore (PER 점수)', () => {
  it('null이면 1점 반환', () => {
    expect(calculatePERScore(null)).toBe(1)
  })

  it('0 이하면 1점 반환', () => {
    expect(calculatePERScore(0)).toBe(1)
    expect(calculatePERScore(-5)).toBe(1)
  })

  it('업종 평균 대비 낮은 PER = 높은 점수', () => {
    // 기본 업종 평균 PER = 15
    expect(calculatePERScore(7)).toBe(10)     // ratio < 0.5
    expect(calculatePERScore(10)).toBe(9)     // ratio 0.67
    expect(calculatePERScore(12)).toBe(8)     // ratio 0.8
  })

  it('업종 평균 대비 높은 PER = 낮은 점수', () => {
    // 기본 업종 평균 PER = 15
    expect(calculatePERScore(30)).toBe(2)     // ratio 2.0 (< 3.0)
    expect(calculatePERScore(45)).toBe(1)     // ratio 3.0
  })

  it('업종별 평균 PER 적용', () => {
    // Technology 평균 PER = 25
    const techScore = calculatePERScore(25, 'Technology')
    expect(techScore).toBe(6) // ratio = 1.0

    // 은행 평균 PER = 8
    const bankScore = calculatePERScore(8, '은행')
    expect(bankScore).toBe(6) // ratio = 1.0
  })

  it('점수는 항상 1-10 범위', () => {
    expect(calculatePERScore(1)).toBeGreaterThanOrEqual(1)
    expect(calculatePERScore(1)).toBeLessThanOrEqual(10)
    expect(calculatePERScore(100)).toBeGreaterThanOrEqual(1)
    expect(calculatePERScore(100)).toBeLessThanOrEqual(10)
  })
})

describe('calculatePBRScore (PBR 점수)', () => {
  it('null이면 1점 반환', () => {
    expect(calculatePBRScore(null)).toBe(1)
  })

  it('0 이하면 1점 반환', () => {
    expect(calculatePBRScore(0)).toBe(1)
    expect(calculatePBRScore(-1)).toBe(1)
  })

  it('낮은 PBR = 높은 점수 (저평가)', () => {
    expect(calculatePBRScore(0.4)).toBe(10)
    expect(calculatePBRScore(0.6)).toBe(9)
    expect(calculatePBRScore(0.9)).toBe(8)
  })

  it('높은 PBR = 낮은 점수 (고평가)', () => {
    expect(calculatePBRScore(4.5)).toBe(2)
    expect(calculatePBRScore(6)).toBe(1)
  })

  it('적정 PBR = 중간 점수', () => {
    expect(calculatePBRScore(1.2)).toBe(7)  // PBR < 1.5 → 7점
    expect(calculatePBRScore(1.8)).toBe(6)  // PBR < 2.0 → 6점
  })
})

describe('calculateROEScore (ROE 점수)', () => {
  it('null이면 5점 반환', () => {
    expect(calculateROEScore(null)).toBe(5)
  })

  it('음수 ROE = 1점', () => {
    expect(calculateROEScore(-10)).toBe(1)
    expect(calculateROEScore(-1)).toBe(1)
  })

  it('높은 ROE = 높은 점수', () => {
    expect(calculateROEScore(35)).toBe(10)
    expect(calculateROEScore(25)).toBe(9)
    expect(calculateROEScore(20)).toBe(8)
  })

  it('낮은 ROE = 낮은 점수', () => {
    expect(calculateROEScore(5)).toBe(3)
    expect(calculateROEScore(2)).toBe(1)
  })

  it('적정 ROE = 중간 점수', () => {
    expect(calculateROEScore(15)).toBe(7)
    expect(calculateROEScore(12)).toBe(6)
  })
})

describe('calculateOperatingMarginScore (영업이익률 점수)', () => {
  it('null이면 5점 반환', () => {
    expect(calculateOperatingMarginScore(null)).toBe(5)
  })

  it('음수 영업이익률 = 1점 (적자)', () => {
    expect(calculateOperatingMarginScore(-5)).toBe(1)
  })

  it('업종 평균 대비 높은 마진 = 높은 점수', () => {
    // 기본 평균 = 10%
    expect(calculateOperatingMarginScore(20)).toBe(10) // ratio 2.0
    expect(calculateOperatingMarginScore(15)).toBe(9)  // ratio 1.5
  })

  it('업종 평균 대비 낮은 마진 = 낮은 점수', () => {
    expect(calculateOperatingMarginScore(5)).toBe(3)   // ratio 0.5
    expect(calculateOperatingMarginScore(3)).toBe(2)   // ratio 0.3
  })

  it('업종별 평균 마진 적용', () => {
    // Technology 평균 = 20%
    const techScore = calculateOperatingMarginScore(20, 'Technology')
    expect(techScore).toBe(6) // ratio = 1.0
  })
})

describe('calculateDebtRatioScore (부채비율 점수)', () => {
  it('null이면 5점 반환', () => {
    expect(calculateDebtRatioScore(null)).toBe(5)
  })

  it('낮은 부채비율 = 높은 점수 (재무 안정)', () => {
    expect(calculateDebtRatioScore(20)).toBe(10)  // 무차입
    expect(calculateDebtRatioScore(40)).toBe(9)   // 우수
    expect(calculateDebtRatioScore(70)).toBe(8)   // 양호
  })

  it('높은 부채비율 = 낮은 점수 (재무 위험)', () => {
    expect(calculateDebtRatioScore(350)).toBe(3)  // 위험
    expect(calculateDebtRatioScore(450)).toBe(2)  // 고위험
    expect(calculateDebtRatioScore(600)).toBe(1)  // 매우 고위험
  })

  it('적정 부채비율 = 중간 점수', () => {
    expect(calculateDebtRatioScore(100)).toBe(7)
    expect(calculateDebtRatioScore(180)).toBe(5)
  })
})

describe('calculateCurrentRatioScore (유동비율 점수)', () => {
  it('null이면 5점 반환', () => {
    expect(calculateCurrentRatioScore(null)).toBe(5)
  })

  it('높은 유동비율 = 높은 점수', () => {
    expect(calculateCurrentRatioScore(200)).toBe(10) // 매우 우수
    expect(calculateCurrentRatioScore(150)).toBe(9)  // 우수
    expect(calculateCurrentRatioScore(120)).toBe(8)  // 양호
  })

  it('낮은 유동비율 = 낮은 점수 (유동성 위험)', () => {
    expect(calculateCurrentRatioScore(40)).toBe(3)
    expect(calculateCurrentRatioScore(15)).toBe(1)
  })

  it('과잉 유동성도 최적은 아님', () => {
    const veryHigh = calculateCurrentRatioScore(350)
    const optimal = calculateCurrentRatioScore(200)
    expect(veryHigh).toBeLessThan(optimal)
  })
})

describe('calculateEPSGrowthScore (EPS 성장률 점수)', () => {
  it('null이면 5점 반환', () => {
    expect(calculateEPSGrowthScore(null)).toBe(5)
  })

  it('고성장 = 높은 점수', () => {
    expect(calculateEPSGrowthScore(55)).toBe(10) // 고성장
    expect(calculateEPSGrowthScore(35)).toBe(9)  // 높은 성장
    expect(calculateEPSGrowthScore(25)).toBe(8)  // 양호
  })

  it('감소 = 낮은 점수', () => {
    expect(calculateEPSGrowthScore(-15)).toBe(2)
    expect(calculateEPSGrowthScore(-25)).toBe(1)
  })

  it('정체/소폭 성장 = 중간 점수', () => {
    expect(calculateEPSGrowthScore(5)).toBe(5)
    expect(calculateEPSGrowthScore(0)).toBe(4)
  })
})

describe('calculateRevenueGrowthScore (매출 성장률 점수)', () => {
  it('null이면 5점 반환', () => {
    expect(calculateRevenueGrowthScore(null)).toBe(5)
  })

  it('고성장 = 높은 점수', () => {
    expect(calculateRevenueGrowthScore(45)).toBe(10)
    expect(calculateRevenueGrowthScore(30)).toBe(9)
    expect(calculateRevenueGrowthScore(20)).toBe(8)
  })

  it('감소 = 낮은 점수', () => {
    expect(calculateRevenueGrowthScore(-8)).toBe(3)
    expect(calculateRevenueGrowthScore(-15)).toBe(2)
    expect(calculateRevenueGrowthScore(-25)).toBe(1)
  })

  it('정체 = 중간 점수', () => {
    expect(calculateRevenueGrowthScore(0)).toBe(5)
    expect(calculateRevenueGrowthScore(-3)).toBe(4)
  })
})

describe('calculateFundamentalScores (종합 기본적 점수)', () => {
  const baseFundamentalData: FundamentalData = {
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

  it('모든 지표가 있을 때 8개 점수 반환', () => {
    const scores = calculateFundamentalScores(baseFundamentalData)

    expect(scores.per).toBeDefined()
    expect(scores.pbr).toBeDefined()
    expect(scores.roe).toBeDefined()
    expect(scores.operatingMargin).toBeDefined()
    expect(scores.debtRatio).toBeDefined()
    expect(scores.currentRatio).toBeDefined()
    expect(scores.epsGrowth).toBeDefined()
    expect(scores.revenueGrowth).toBeDefined()
    expect(scores.average).toBeDefined()
  })

  it('평균 점수는 1-10 범위', () => {
    const scores = calculateFundamentalScores(baseFundamentalData)
    expect(scores.average).toBeGreaterThanOrEqual(1)
    expect(scores.average).toBeLessThanOrEqual(10)
  })

  it('우량 기업 데이터 = 높은 평균', () => {
    const excellentData: FundamentalData = {
      ...baseFundamentalData,
      per: 8,              // 저평가
      pbr: 0.8,            // 저평가
      roe: 25,             // 높은 ROE
      operatingMargin: 20, // 높은 마진
      debtRatio: 30,       // 낮은 부채
      currentRatio: 200,   // 높은 유동성
      epsGrowth: 30,       // 고성장
      revenueGrowth: 25,   // 고성장
    }

    const scores = calculateFundamentalScores(excellentData)
    expect(scores.average).toBeGreaterThan(8)
  })

  it('문제 있는 기업 데이터 = 낮은 평균', () => {
    const troubledData: FundamentalData = {
      ...baseFundamentalData,
      per: 50,             // 고평가
      pbr: 5,              // 고평가
      roe: 2,              // 낮은 ROE
      operatingMargin: -5, // 적자
      debtRatio: 500,      // 고부채
      currentRatio: 30,    // 낮은 유동성
      epsGrowth: -30,      // 감소
      revenueGrowth: -20,  // 감소
    }

    const scores = calculateFundamentalScores(troubledData)
    expect(scores.average).toBeLessThan(3)
  })

  it('업종 파라미터 전달', () => {
    const scores1 = calculateFundamentalScores(baseFundamentalData)
    const scores2 = calculateFundamentalScores(baseFundamentalData, 'Technology')

    // 같은 데이터지만 업종에 따라 PER, 영업이익률 점수가 다를 수 있음
    expect(scores1.per).not.toBe(scores2.per)
  })
})

describe('Edge Cases (엣지 케이스)', () => {
  it('모든 값이 null인 경우', () => {
    const nullData: FundamentalData = {
      per: null,
      pbr: null,
      roe: null,
      operatingMargin: null,
      eps: null,
      marketCap: null,
      debtRatio: null,
      currentRatio: null,
      epsGrowth: null,
      revenueGrowth: null,
    }

    const scores = calculateFundamentalScores(nullData)

    // null 처리에 따른 기본값
    expect(scores.per).toBe(1)  // null → 1
    expect(scores.pbr).toBe(1)  // null → 1
    expect(scores.roe).toBe(5)  // null → 5
    expect(scores.operatingMargin).toBe(5)
    expect(scores.debtRatio).toBe(5)
    expect(scores.currentRatio).toBe(5)
    expect(scores.epsGrowth).toBe(5)
    expect(scores.revenueGrowth).toBe(5)
  })

  it('극단적으로 높은 PER', () => {
    expect(calculatePERScore(1000)).toBe(1)
  })

  it('극단적으로 낮은 PER (거의 0)', () => {
    expect(calculatePERScore(0.1)).toBe(10)
  })

  it('극단적으로 높은 ROE', () => {
    expect(calculateROEScore(100)).toBe(10)
  })

  it('극단적으로 높은 부채비율', () => {
    expect(calculateDebtRatioScore(1000)).toBe(1)
  })

  it('극단적으로 높은 유동비율', () => {
    const score = calculateCurrentRatioScore(1000)
    expect(score).toBe(8) // 과잉 유동성
  })
})
