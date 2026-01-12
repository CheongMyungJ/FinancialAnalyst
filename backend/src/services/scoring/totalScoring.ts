/**
 * 종합 점수 계산 모듈 (Backend)
 */

import type {
  StockScores,
  FundamentalData,
  TechnicalData,
  NewsData,
  WeightConfig,
  DEFAULT_WEIGHTS,
} from '../../types/index.js'
import { calculateFundamentalScores } from './fundamentalScoring.js'
import { calculateTechnicalScores } from './technicalScoring.js'
import { calculateNewsScores } from './newsScoring.js'

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
  scores: { per: number; pbr: number; roe: number; operatingMargin: number },
  weights: WeightConfig['fundamental']
): number {
  return weightedAverage(
    [scores.per, scores.pbr, scores.roe, scores.operatingMargin],
    [weights.per, weights.pbr, weights.roe, weights.operatingMargin]
  )
}

export function calculateWeightedTechnicalScore(
  scores: { maPosition: number; rsi: number; volumeTrend: number; macd: number },
  weights: WeightConfig['technical']
): number {
  return weightedAverage(
    [scores.maPosition, scores.rsi, scores.volumeTrend, scores.macd],
    [weights.maPosition, weights.rsi, weights.volumeTrend, weights.macd]
  )
}

export function calculateWeightedNewsScore(
  scores: { sentiment: number; frequency: number },
  weights: WeightConfig['news']
): number {
  return weightedAverage(
    [scores.sentiment, scores.frequency],
    [weights.sentiment, weights.frequency]
  )
}

export function calculateTotalScore(
  fundamentalAvg: number,
  technicalAvg: number,
  newsAvg: number,
  categoryWeights: WeightConfig['category']
): number {
  const total = weightedAverage(
    [fundamentalAvg, technicalAvg, newsAvg],
    [categoryWeights.fundamental, categoryWeights.technical, categoryWeights.news]
  )

  return Math.round(total * 10) / 10
}

export function calculateAllScores(
  fundamentals: FundamentalData,
  technicals: TechnicalData,
  newsData: NewsData,
  currentPrice: number,
  priceChange: number,
  sector?: string,
  weights?: WeightConfig
): StockScores {
  const defaultWeights: WeightConfig = {
    fundamental: { per: 25, pbr: 25, roe: 25, operatingMargin: 25 },
    technical: { maPosition: 25, rsi: 25, volumeTrend: 25, macd: 25 },
    news: { sentiment: 50, frequency: 50 },
    category: { fundamental: 40, technical: 40, news: 20 },
  }

  const w = weights || defaultWeights

  const fundamentalScores = calculateFundamentalScores(fundamentals, sector)
  const technicalScores = calculateTechnicalScores(technicals, currentPrice, priceChange)
  const newsScores = calculateNewsScores(newsData)

  const fundamentalWeightedAvg = calculateWeightedFundamentalScore(fundamentalScores, w.fundamental)
  const technicalWeightedAvg = calculateWeightedTechnicalScore(technicalScores, w.technical)
  const newsWeightedAvg = calculateWeightedNewsScore(newsScores, w.news)

  const total = calculateTotalScore(
    fundamentalWeightedAvg,
    technicalWeightedAvg,
    newsWeightedAvg,
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
  }
}
