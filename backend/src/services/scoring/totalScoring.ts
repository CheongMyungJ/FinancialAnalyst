/**
 * 종합 점수 계산 모듈 (Backend)
 */

import type {
  StockScores,
  FundamentalData,
  TechnicalData,
  NewsData,
  SupplyDemandData,
  WeightConfig,
  DEFAULT_WEIGHTS,
} from '../../types/index.js'
import { calculateFundamentalScores } from './fundamentalScoring.js'
import { calculateTechnicalScores } from './technicalScoring.js'
import { calculateNewsScores } from './newsScoring.js'
import { calculateSupplyDemandScores } from './supplyDemandScoring.js'

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

export function calculateWeightedFundamentalScore(
  scores: { per: number; pbr: number; roe: number; operatingMargin: number; debtRatio: number; currentRatio: number; epsGrowth: number; revenueGrowth: number },
  weights: WeightConfig['fundamental']
): number {
  return weightedAverage(
    [scores.per, scores.pbr, scores.roe, scores.operatingMargin, scores.debtRatio, scores.currentRatio, scores.epsGrowth, scores.revenueGrowth],
    [weights.per, weights.pbr, weights.roe, weights.operatingMargin, weights.debtRatio, weights.currentRatio, weights.epsGrowth, weights.revenueGrowth]
  )
}

export function calculateWeightedTechnicalScore(
  scores: { maPosition: number; rsi: number; volumeTrend: number; macd: number; bollingerBand: number; stochastic: number; adx: number; divergence: number },
  weights: WeightConfig['technical']
): number {
  return weightedAverage(
    [scores.maPosition, scores.rsi, scores.volumeTrend, scores.macd, scores.bollingerBand, scores.stochastic, scores.adx, scores.divergence],
    [weights.maPosition, weights.rsi, weights.volumeTrend, weights.macd, weights.bollingerBand, weights.stochastic, weights.adx, weights.divergence]
  )
}

export function calculateWeightedNewsScore(
  scores: { sentiment: number; frequency: number; disclosureImpact: number; recency: number },
  weights: WeightConfig['news']
): number {
  return weightedAverage(
    [scores.sentiment, scores.frequency, scores.disclosureImpact, scores.recency],
    [weights.sentiment, weights.frequency, weights.disclosureImpact, weights.recency]
  )
}

export function calculateWeightedSupplyDemandScore(
  scores: { foreignFlow: number; institutionFlow: number },
  weights: WeightConfig['supplyDemand']
): number {
  return weightedAverage(
    [scores.foreignFlow, scores.institutionFlow],
    [weights.foreignFlow, weights.institutionFlow]
  )
}

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
  const defaultWeights: WeightConfig = {
    fundamental: { per: 15, pbr: 15, roe: 15, operatingMargin: 15, debtRatio: 10, currentRatio: 10, epsGrowth: 10, revenueGrowth: 10 },
    technical: { maPosition: 15, rsi: 15, volumeTrend: 10, macd: 15, bollingerBand: 15, stochastic: 10, adx: 10, divergence: 10 },
    news: { sentiment: 30, frequency: 30, disclosureImpact: 20, recency: 20 },
    supplyDemand: { foreignFlow: 50, institutionFlow: 50 },
    category: { fundamental: 35, technical: 35, news: 15, supplyDemand: 15 },
  }

  const w = weights || defaultWeights

  const fundamentalScores = calculateFundamentalScores(fundamentals, sector)
  const technicalScores = calculateTechnicalScores(technicals, currentPrice, priceChange)
  const newsScores = calculateNewsScores(newsData)
  const supplyDemandScores = calculateSupplyDemandScores(supplyDemand)

  const fundamentalWeightedAvg = calculateWeightedFundamentalScore(fundamentalScores, w.fundamental)
  const technicalWeightedAvg = calculateWeightedTechnicalScore(technicalScores, w.technical)
  const newsWeightedAvg = calculateWeightedNewsScore(newsScores, w.news)
  const supplyDemandWeightedAvg = calculateWeightedSupplyDemandScore(supplyDemandScores, w.supplyDemand)

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
