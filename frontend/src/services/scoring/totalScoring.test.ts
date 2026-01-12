/**
 * 종합 스코어링 함수 테스트 (Frontend)
 */

import { describe, it, expect } from 'vitest'
import {
  calculateWeightedFundamentalScore,
  calculateWeightedTechnicalScore,
  calculateWeightedNewsScore,
  calculateWeightedSupplyDemandScore,
  calculateTotalScore,
  calculateAllScores,
} from './totalScoring'
import type {
  WeightConfig,
  FundamentalData,
  TechnicalData,
  NewsData,
  SupplyDemandData,
} from '../../types'

const defaultWeights: WeightConfig = {
  fundamental: { per: 15, pbr: 15, roe: 15, operatingMargin: 15, debtRatio: 10, currentRatio: 10, epsGrowth: 10, revenueGrowth: 10 },
  technical: { maPosition: 15, rsi: 15, volumeTrend: 10, macd: 15, bollingerBand: 15, stochastic: 10, adx: 10, divergence: 10 },
  news: { sentiment: 30, frequency: 30, disclosureImpact: 20, recency: 20 },
  supplyDemand: { foreignFlow: 50, institutionFlow: 50 },
  category: { fundamental: 35, technical: 35, news: 15, supplyDemand: 15 },
}

describe('calculateWeightedFundamentalScore', () => {
  it('모든 점수가 5일 때 평균도 5', () => {
    const scores = {
      per: 5, pbr: 5, roe: 5, operatingMargin: 5,
      debtRatio: 5, currentRatio: 5, epsGrowth: 5, revenueGrowth: 5,
    }
    expect(calculateWeightedFundamentalScore(scores, defaultWeights.fundamental)).toBe(5)
  })

  it('모든 점수가 10일 때 평균도 10', () => {
    const scores = {
      per: 10, pbr: 10, roe: 10, operatingMargin: 10,
      debtRatio: 10, currentRatio: 10, epsGrowth: 10, revenueGrowth: 10,
    }
    expect(calculateWeightedFundamentalScore(scores, defaultWeights.fundamental)).toBe(10)
  })
})

describe('calculateWeightedTechnicalScore', () => {
  it('모든 점수가 5일 때 평균도 5', () => {
    const scores = {
      maPosition: 5, rsi: 5, volumeTrend: 5, macd: 5,
      bollingerBand: 5, stochastic: 5, adx: 5, divergence: 5,
    }
    expect(calculateWeightedTechnicalScore(scores, defaultWeights.technical)).toBe(5)
  })
})

describe('calculateWeightedNewsScore', () => {
  it('모든 점수가 5일 때 평균도 5', () => {
    const scores = { sentiment: 5, frequency: 5, disclosureImpact: 5, recency: 5 }
    expect(calculateWeightedNewsScore(scores, defaultWeights.news)).toBe(5)
  })
})

describe('calculateWeightedSupplyDemandScore', () => {
  it('50:50 가중치로 평균 계산', () => {
    const scores = { foreignFlow: 10, institutionFlow: 6 }
    expect(calculateWeightedSupplyDemandScore(scores, defaultWeights.supplyDemand)).toBe(8)
  })
})

describe('calculateTotalScore', () => {
  it('모든 카테고리가 5점이면 총점도 5', () => {
    expect(calculateTotalScore(5, 5, 5, 5, defaultWeights.category)).toBe(5)
  })

  it('기본/기술 가중치(35%)가 높음', () => {
    const result = calculateTotalScore(10, 10, 1, 1, defaultWeights.category)
    expect(result).toBe(7.3)
  })
})

describe('calculateAllScores', () => {
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

  it('모든 카테고리 점수 반환', () => {
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

    expect(result.total).toBeCloseTo(result.fundamental.average, 0)
  })
})

describe('Edge Cases', () => {
  it('모든 가중치가 0이면 0 반환', () => {
    const zeroWeights = { per: 0, pbr: 0, roe: 0, operatingMargin: 0, debtRatio: 0, currentRatio: 0, epsGrowth: 0, revenueGrowth: 0 }
    const scores = { per: 10, pbr: 10, roe: 10, operatingMargin: 10, debtRatio: 10, currentRatio: 10, epsGrowth: 10, revenueGrowth: 10 }
    expect(calculateWeightedFundamentalScore(scores, zeroWeights)).toBe(0)
  })
})
