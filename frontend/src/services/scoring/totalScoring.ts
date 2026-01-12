/**
 * 종합 점수 계산 모듈
 * 기본적, 기술적, 뉴스, 수급 분석 점수를 가중치에 따라 합산하여 종합 점수를 산출합니다.
 */

import type {
  Stock,
  StockScores,
  FundamentalData,
  TechnicalData,
  NewsData,
  SupplyDemandData,
  WeightConfig,
} from '../../types'
import { calculateFundamentalScores } from './fundamentalScoring'
import { calculateTechnicalScores } from './technicalScoring'
import { calculateNewsScores } from './newsScoring'
import { calculateSupplyDemandScores } from './supplyDemandScoring'

/**
 * 가중 평균 계산 헬퍼 함수
 */
function weightedAverage(values: number[], weights: number[]): number {
  if (values.length !== weights.length || values.length === 0) {
    return 0
  }

  const totalWeight = weights.reduce((a, b) => a + b, 0)
  if (totalWeight === 0) return 0

  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i] * weights[i]
  }

  return sum / totalWeight
}

/**
 * 기본적 분석 점수 가중 평균 계산
 */
export function calculateWeightedFundamentalScore(
  scores: { per: number; pbr: number; roe: number; operatingMargin: number; debtRatio: number; currentRatio: number; epsGrowth: number; revenueGrowth: number },
  weights: WeightConfig['fundamental']
): number {
  return weightedAverage(
    [scores.per, scores.pbr, scores.roe, scores.operatingMargin, scores.debtRatio, scores.currentRatio, scores.epsGrowth, scores.revenueGrowth],
    [weights.per, weights.pbr, weights.roe, weights.operatingMargin, weights.debtRatio, weights.currentRatio, weights.epsGrowth, weights.revenueGrowth]
  )
}

/**
 * 기술적 분석 점수 가중 평균 계산
 */
export function calculateWeightedTechnicalScore(
  scores: { maPosition: number; rsi: number; volumeTrend: number; macd: number; bollingerBand: number; stochastic: number; adx: number; divergence: number },
  weights: WeightConfig['technical']
): number {
  return weightedAverage(
    [scores.maPosition, scores.rsi, scores.volumeTrend, scores.macd, scores.bollingerBand, scores.stochastic, scores.adx, scores.divergence],
    [weights.maPosition, weights.rsi, weights.volumeTrend, weights.macd, weights.bollingerBand, weights.stochastic, weights.adx, weights.divergence]
  )
}

/**
 * 뉴스 분석 점수 가중 평균 계산
 */
export function calculateWeightedNewsScore(
  scores: { sentiment: number; frequency: number; disclosureImpact: number; recency: number },
  weights: WeightConfig['news']
): number {
  return weightedAverage(
    [scores.sentiment, scores.frequency, scores.disclosureImpact, scores.recency],
    [weights.sentiment, weights.frequency, weights.disclosureImpact, weights.recency]
  )
}

/**
 * 수급 분석 점수 가중 평균 계산
 */
export function calculateWeightedSupplyDemandScore(
  scores: { foreignFlow: number; institutionFlow: number },
  weights: WeightConfig['supplyDemand']
): number {
  return weightedAverage(
    [scores.foreignFlow, scores.institutionFlow],
    [weights.foreignFlow, weights.institutionFlow]
  )
}

/**
 * 종합 점수 계산
 */
export function calculateTotalScore(
  fundamentalAvg: number,
  technicalAvg: number,
  newsAvg: number,
  supplyDemandAvg: number,
  categoryWeights: WeightConfig['category']
): number {
  const total = weightedAverage(
    [fundamentalAvg, technicalAvg, newsAvg, supplyDemandAvg],
    [categoryWeights.fundamental, categoryWeights.technical, categoryWeights.news, categoryWeights.supplyDemand]
  )

  return Math.round(total * 10) / 10
}

/**
 * 전체 점수 계산 (메인 함수)
 */
export function calculateAllScores(
  fundamentals: FundamentalData,
  technicals: TechnicalData,
  newsData: NewsData,
  supplyDemand: SupplyDemandData,
  currentPrice: number,
  priceChange: number,
  sector?: string,
  weights?: WeightConfig
): StockScores {
  // 기본 가중치 (제공되지 않은 경우)
  const defaultWeights: WeightConfig = {
    fundamental: { per: 15, pbr: 15, roe: 15, operatingMargin: 15, debtRatio: 10, currentRatio: 10, epsGrowth: 10, revenueGrowth: 10 },
    technical: { maPosition: 15, rsi: 15, volumeTrend: 10, macd: 15, bollingerBand: 15, stochastic: 10, adx: 10, divergence: 10 },
    news: { sentiment: 30, frequency: 30, disclosureImpact: 20, recency: 20 },
    supplyDemand: { foreignFlow: 50, institutionFlow: 50 },
    category: { fundamental: 35, technical: 35, news: 15, supplyDemand: 15 },
  }

  const w = weights || defaultWeights

  // 각 카테고리별 점수 계산
  const fundamentalScores = calculateFundamentalScores(fundamentals, sector)
  const technicalScores = calculateTechnicalScores(technicals, currentPrice, priceChange)
  const newsScores = calculateNewsScores(newsData)
  const supplyDemandScores = calculateSupplyDemandScores(supplyDemand)

  // 가중 평균으로 카테고리별 최종 점수 계산
  const fundamentalWeightedAvg = calculateWeightedFundamentalScore(fundamentalScores, w.fundamental)
  const technicalWeightedAvg = calculateWeightedTechnicalScore(technicalScores, w.technical)
  const newsWeightedAvg = calculateWeightedNewsScore(newsScores, w.news)
  const supplyDemandWeightedAvg = calculateWeightedSupplyDemandScore(supplyDemandScores, w.supplyDemand)

  // 종합 점수 계산
  const total = calculateTotalScore(
    fundamentalWeightedAvg,
    technicalWeightedAvg,
    newsWeightedAvg,
    supplyDemandWeightedAvg,
    w.category
  )

  return {
    total,
    fundamental: {
      ...fundamentalScores,
      average: Math.round(fundamentalWeightedAvg * 10) / 10,
    },
    technical: {
      ...technicalScores,
      average: Math.round(technicalWeightedAvg * 10) / 10,
    },
    news: {
      ...newsScores,
      average: Math.round(newsWeightedAvg * 10) / 10,
    },
    supplyDemand: {
      ...supplyDemandScores,
      average: Math.round(supplyDemandWeightedAvg * 10) / 10,
    },
  }
}

// 기본 수급 데이터 (기존 데이터 호환성)
const DEFAULT_SUPPLY_DEMAND: SupplyDemandData = {
  foreignNetBuy: null,
  institutionNetBuy: null,
  foreignNetBuyDays: null,
  institutionNetBuyDays: null,
  foreignOwnership: null,
}

/**
 * 주식 목록에 대해 점수 재계산 (가중치 변경 시)
 */
export function recalculateScoresWithWeights(
  stocks: Stock[],
  weights: WeightConfig
): Stock[] {
  return stocks.map(stock => {
    const scores = calculateAllScores(
      stock.fundamentals,
      stock.technicals,
      stock.newsData,
      stock.supplyDemand || DEFAULT_SUPPLY_DEMAND,
      stock.currentPrice,
      stock.changePercent,
      stock.sector,
      weights
    )

    return {
      ...stock,
      scores,
    }
  })
}

/**
 * 단일 종목 점수 재계산
 */
export function recalculateSingleStockScores(
  stock: Stock,
  weights: WeightConfig
): StockScores {
  return calculateAllScores(
    stock.fundamentals,
    stock.technicals,
    stock.newsData,
    stock.supplyDemand || DEFAULT_SUPPLY_DEMAND,
    stock.currentPrice,
    stock.changePercent,
    stock.sector,
    weights
  )
}
