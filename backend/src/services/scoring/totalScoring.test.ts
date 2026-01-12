/**
 * 종합 스코어링 함수 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  calculateWeightedFundamentalScore,
  calculateWeightedTechnicalScore,
  calculateWeightedNewsScore,
  calculateWeightedSupplyDemandScore,
  calculateTotalScore,
  calculateAllScores,
} from './totalScoring.js'
import type {
  WeightConfig,
  FundamentalData,
  TechnicalData,
  NewsData,
  SupplyDemandData,
} from '../../types/index.js'

const defaultWeights: WeightConfig = {
  fundamental: { per: 15, pbr: 15, roe: 15, operatingMargin: 15, debtRatio: 10, currentRatio: 10, epsGrowth: 10, revenueGrowth: 10 },
  technical: { maPosition: 15, rsi: 15, volumeTrend: 10, macd: 15, bollingerBand: 15, stochastic: 10, adx: 10, divergence: 10 },
  news: { sentiment: 30, frequency: 30, disclosureImpact: 20, recency: 20 },
  supplyDemand: { foreignFlow: 50, institutionFlow: 50 },
  category: { fundamental: 35, technical: 35, news: 15, supplyDemand: 15 },
}

describe('calculateWeightedFundamentalScore (가중 기본적 점수)', () => {
  const allFiveScores = {
    per: 5, pbr: 5, roe: 5, operatingMargin: 5,
    debtRatio: 5, currentRatio: 5, epsGrowth: 5, revenueGrowth: 5,
  }

  it('모든 점수가 5일 때 평균도 5', () => {
    const result = calculateWeightedFundamentalScore(allFiveScores, defaultWeights.fundamental)
    expect(result).toBe(5)
  })

  it('모든 점수가 10일 때 평균도 10', () => {
    const allTenScores = {
      per: 10, pbr: 10, roe: 10, operatingMargin: 10,
      debtRatio: 10, currentRatio: 10, epsGrowth: 10, revenueGrowth: 10,
    }
    const result = calculateWeightedFundamentalScore(allTenScores, defaultWeights.fundamental)
    expect(result).toBe(10)
  })

  it('높은 가중치 항목이 평균에 더 영향', () => {
    const mixedScores = {
      per: 10, pbr: 10, roe: 10, operatingMargin: 10,  // 15%씩 = 높은 가중치
      debtRatio: 1, currentRatio: 1, epsGrowth: 1, revenueGrowth: 1,  // 10%씩 = 낮은 가중치
    }
    const result = calculateWeightedFundamentalScore(mixedScores, defaultWeights.fundamental)
    // 가중 평균: (10*15 + 10*15 + 10*15 + 10*15 + 1*10 + 1*10 + 1*10 + 1*10) / 100
    // = (150 + 150 + 150 + 150 + 10 + 10 + 10 + 10) / 100 = 640 / 100 = 6.4
    expect(result).toBeCloseTo(6.4, 1)
  })

  it('커스텀 가중치 적용', () => {
    const customWeights = {
      per: 100, pbr: 0, roe: 0, operatingMargin: 0,
      debtRatio: 0, currentRatio: 0, epsGrowth: 0, revenueGrowth: 0,
    }
    const scores = { ...allFiveScores, per: 10 }
    const result = calculateWeightedFundamentalScore(scores, customWeights)
    expect(result).toBe(10)  // PER만 100% 가중치
  })
})

describe('calculateWeightedTechnicalScore (가중 기술적 점수)', () => {
  const allFiveScores = {
    maPosition: 5, rsi: 5, volumeTrend: 5, macd: 5,
    bollingerBand: 5, stochastic: 5, adx: 5, divergence: 5,
  }

  it('모든 점수가 5일 때 평균도 5', () => {
    const result = calculateWeightedTechnicalScore(allFiveScores, defaultWeights.technical)
    expect(result).toBe(5)
  })

  it('모든 점수가 10일 때 평균도 10', () => {
    const allTenScores = {
      maPosition: 10, rsi: 10, volumeTrend: 10, macd: 10,
      bollingerBand: 10, stochastic: 10, adx: 10, divergence: 10,
    }
    const result = calculateWeightedTechnicalScore(allTenScores, defaultWeights.technical)
    expect(result).toBe(10)
  })

  it('높은 가중치 항목이 평균에 더 영향', () => {
    const mixedScores = {
      maPosition: 10, rsi: 10, macd: 10, bollingerBand: 10,  // 15%씩
      volumeTrend: 1, stochastic: 1, adx: 1, divergence: 1,  // 10%씩
    }
    const result = calculateWeightedTechnicalScore(mixedScores, defaultWeights.technical)
    // (10*15 + 10*15 + 1*10 + 10*15 + 10*15 + 1*10 + 1*10 + 1*10) / 100
    expect(result).toBeCloseTo(6.4, 1)
  })
})

describe('calculateWeightedNewsScore (가중 뉴스 점수)', () => {
  const allFiveScores = {
    sentiment: 5, frequency: 5, disclosureImpact: 5, recency: 5,
  }

  it('모든 점수가 5일 때 평균도 5', () => {
    const result = calculateWeightedNewsScore(allFiveScores, defaultWeights.news)
    expect(result).toBe(5)
  })

  it('sentiment와 frequency가 높은 가중치', () => {
    const mixedScores = {
      sentiment: 10, frequency: 10,         // 30%씩
      disclosureImpact: 1, recency: 1,      // 20%씩
    }
    const result = calculateWeightedNewsScore(mixedScores, defaultWeights.news)
    // (10*30 + 10*30 + 1*20 + 1*20) / 100 = 640 / 100 = 6.4
    expect(result).toBeCloseTo(6.4, 1)
  })
})

describe('calculateWeightedSupplyDemandScore (가중 수급 점수)', () => {
  it('외국인/기관 점수가 같으면 평균도 같음', () => {
    const scores = { foreignFlow: 8, institutionFlow: 8 }
    const result = calculateWeightedSupplyDemandScore(scores, defaultWeights.supplyDemand)
    expect(result).toBe(8)
  })

  it('50:50 가중치로 평균 계산', () => {
    const scores = { foreignFlow: 10, institutionFlow: 6 }
    const result = calculateWeightedSupplyDemandScore(scores, defaultWeights.supplyDemand)
    expect(result).toBe(8)  // (10 + 6) / 2
  })

  it('커스텀 가중치 적용', () => {
    const scores = { foreignFlow: 10, institutionFlow: 6 }
    const customWeights = { foreignFlow: 80, institutionFlow: 20 }
    const result = calculateWeightedSupplyDemandScore(scores, customWeights)
    // (10*80 + 6*20) / 100 = (800 + 120) / 100 = 9.2
    expect(result).toBeCloseTo(9.2, 1)
  })
})

describe('calculateTotalScore (총점 계산)', () => {
  it('모든 카테고리가 5점이면 총점도 5', () => {
    const result = calculateTotalScore(5, 5, 5, 5, defaultWeights.category)
    expect(result).toBe(5)
  })

  it('기본/기술 가중치(35%)가 높음', () => {
    // fundamental: 35%, technical: 35%, news: 15%, supplyDemand: 15%
    const result = calculateTotalScore(10, 10, 1, 1, defaultWeights.category)
    // (10*35 + 10*35 + 1*15 + 1*15) / 100 = 730 / 100 = 7.3
    expect(result).toBe(7.3)
  })

  it('결과는 소수점 첫째 자리까지', () => {
    const result = calculateTotalScore(7.333, 7.333, 7.333, 7.333, defaultWeights.category)
    expect(result.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(1)
  })
})

describe('calculateAllScores (전체 점수 계산)', () => {
  const baseFundamentals: FundamentalData = {
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

  const baseTechnicals: TechnicalData = {
    ma20: 100,
    ma60: 95,
    ma120: 90,
    rsi: 50,
    macd: 0.5,
    macdSignal: 0.3,
    macdHistogram: 0.2,
    prevMacdHistogram: 0.1,
    bollingerPosition: 0.5,
    bollingerBandwidth: 10,
    stochasticK: 50,
    stochasticD: 50,
    adx: 25,
    plusDI: 20,
    minusDI: 15,
    volumeRatio: 1.0,
    rsiDivergence: null,
    macdDivergence: null,
  }

  const baseNewsData: NewsData = {
    newsCount: 10,
    disclosureCount: 5,
    sentimentScore: 6,
    recentNews: [],
    recentDisclosures: [],
  }

  const baseSupplyDemand: SupplyDemandData = {
    foreignNetBuy: 50,
    foreignNetBuyDays: 5,
    foreignOwnership: 20,
    institutionNetBuy: 30,
    institutionNetBuyDays: 3,
  }

  it('모든 카테고리 점수가 포함됨', () => {
    const result = calculateAllScores(
      baseFundamentals,
      baseTechnicals,
      baseNewsData,
      baseSupplyDemand,
      100,
      2
    )

    expect(result.total).toBeDefined()
    expect(result.fundamental).toBeDefined()
    expect(result.technical).toBeDefined()
    expect(result.news).toBeDefined()
    expect(result.supplyDemand).toBeDefined()
  })

  it('총점은 1-10 범위', () => {
    const result = calculateAllScores(
      baseFundamentals,
      baseTechnicals,
      baseNewsData,
      baseSupplyDemand,
      100,
      2
    )

    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.total).toBeLessThanOrEqual(10)
  })

  it('각 카테고리 평균도 1-10 범위', () => {
    const result = calculateAllScores(
      baseFundamentals,
      baseTechnicals,
      baseNewsData,
      baseSupplyDemand,
      100,
      2
    )

    expect(result.fundamental.average).toBeGreaterThanOrEqual(1)
    expect(result.fundamental.average).toBeLessThanOrEqual(10)
    expect(result.technical.average).toBeGreaterThanOrEqual(1)
    expect(result.technical.average).toBeLessThanOrEqual(10)
    expect(result.news.average).toBeGreaterThanOrEqual(1)
    expect(result.news.average).toBeLessThanOrEqual(10)
    expect(result.supplyDemand.average).toBeGreaterThanOrEqual(1)
    expect(result.supplyDemand.average).toBeLessThanOrEqual(10)
  })

  it('sector 파라미터 전달', () => {
    const result1 = calculateAllScores(
      baseFundamentals,
      baseTechnicals,
      baseNewsData,
      baseSupplyDemand,
      100,
      2
    )

    const result2 = calculateAllScores(
      baseFundamentals,
      baseTechnicals,
      baseNewsData,
      baseSupplyDemand,
      100,
      2,
      'Technology'
    )

    // 업종에 따라 기본적 분석 점수가 달라질 수 있음
    expect(result1.fundamental.per).not.toBe(result2.fundamental.per)
  })

  it('커스텀 가중치 적용', () => {
    const customWeights: WeightConfig = {
      fundamental: { per: 100, pbr: 0, roe: 0, operatingMargin: 0, debtRatio: 0, currentRatio: 0, epsGrowth: 0, revenueGrowth: 0 },
      technical: { maPosition: 100, rsi: 0, volumeTrend: 0, macd: 0, bollingerBand: 0, stochastic: 0, adx: 0, divergence: 0 },
      news: { sentiment: 100, frequency: 0, disclosureImpact: 0, recency: 0 },
      supplyDemand: { foreignFlow: 100, institutionFlow: 0 },
      category: { fundamental: 100, technical: 0, news: 0, supplyDemand: 0 },
    }

    const result = calculateAllScores(
      baseFundamentals,
      baseTechnicals,
      baseNewsData,
      baseSupplyDemand,
      100,
      2,
      undefined,
      customWeights
    )

    // 기본적 분석만 100% 가중치이므로 total ≈ fundamental.average
    expect(result.total).toBeCloseTo(result.fundamental.average, 0)
  })

  it('우량 데이터 = 높은 총점', () => {
    const excellentFundamentals: FundamentalData = {
      per: 8,
      pbr: 0.8,
      roe: 25,
      operatingMargin: 20,
      eps: 10000,
      marketCap: 100000000000,
      debtRatio: 30,
      currentRatio: 200,
      epsGrowth: 30,
      revenueGrowth: 25,
    }

    const excellentTechnicals: TechnicalData = {
      ...baseTechnicals,
      rsi: 45,
      adx: 35,
      plusDI: 30,
      minusDI: 10,
    }

    const result = calculateAllScores(
      excellentFundamentals,
      excellentTechnicals,
      baseNewsData,
      baseSupplyDemand,
      100,
      2
    )

    expect(result.total).toBeGreaterThan(6)
  })

  it('문제 데이터 = 낮은 총점', () => {
    const troubledFundamentals: FundamentalData = {
      per: 50,
      pbr: 5,
      roe: 2,
      operatingMargin: -5,
      eps: 100,
      marketCap: 100000000000,
      debtRatio: 500,
      currentRatio: 30,
      epsGrowth: -30,
      revenueGrowth: -20,
    }

    const troubledTechnicals: TechnicalData = {
      ...baseTechnicals,
      rsi: 85,
      adx: 40,
      plusDI: 10,
      minusDI: 35,
    }

    const troubledSupplyDemand: SupplyDemandData = {
      foreignNetBuy: -200,
      foreignNetBuyDays: -15,
      foreignOwnership: 10,
      institutionNetBuy: -200,
      institutionNetBuyDays: -15,
    }

    const result = calculateAllScores(
      troubledFundamentals,
      troubledTechnicals,
      baseNewsData,
      troubledSupplyDemand,
      100,
      -5
    )

    expect(result.total).toBeLessThan(4)
  })
})

describe('Edge Cases (엣지 케이스)', () => {
  it('모든 가중치가 0이면 0 반환', () => {
    const zeroWeights = { per: 0, pbr: 0, roe: 0, operatingMargin: 0, debtRatio: 0, currentRatio: 0, epsGrowth: 0, revenueGrowth: 0 }
    const scores = { per: 10, pbr: 10, roe: 10, operatingMargin: 10, debtRatio: 10, currentRatio: 10, epsGrowth: 10, revenueGrowth: 10 }
    const result = calculateWeightedFundamentalScore(scores, zeroWeights)
    expect(result).toBe(0)
  })

  it('단일 가중치만 있을 때', () => {
    const singleWeight = { foreignFlow: 100, institutionFlow: 0 }
    const scores = { foreignFlow: 8, institutionFlow: 2 }
    const result = calculateWeightedSupplyDemandScore(scores, singleWeight)
    expect(result).toBe(8)
  })
})
