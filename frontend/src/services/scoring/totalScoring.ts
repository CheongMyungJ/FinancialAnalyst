/**
 * 종합 점수 계산 모듈
 * 기본적, 기술적, 뉴스 분석 점수를 가중치에 따라 합산하여 종합 점수를 산출합니다.
 */

import type {
  Stock,
  StockScores,
  FundamentalData,
  TechnicalData,
  NewsData,
  WeightConfig,
} from '../../types'
import { calculateFundamentalScores } from './fundamentalScoring'
import { calculateTechnicalScores } from './technicalScoring'
import { calculateNewsScores } from './newsScoring'

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
  scores: { per: number; pbr: number; roe: number; operatingMargin: number },
  weights: WeightConfig['fundamental']
): number {
  return weightedAverage(
    [scores.per, scores.pbr, scores.roe, scores.operatingMargin],
    [weights.per, weights.pbr, weights.roe, weights.operatingMargin]
  )
}

/**
 * 기술적 분석 점수 가중 평균 계산
 */
export function calculateWeightedTechnicalScore(
  scores: { maPosition: number; rsi: number; volumeTrend: number; macd: number },
  weights: WeightConfig['technical']
): number {
  return weightedAverage(
    [scores.maPosition, scores.rsi, scores.volumeTrend, scores.macd],
    [weights.maPosition, weights.rsi, weights.volumeTrend, weights.macd]
  )
}

/**
 * 뉴스 분석 점수 가중 평균 계산
 */
export function calculateWeightedNewsScore(
  scores: { sentiment: number; frequency: number },
  weights: WeightConfig['news']
): number {
  return weightedAverage(
    [scores.sentiment, scores.frequency],
    [weights.sentiment, weights.frequency]
  )
}

/**
 * 종합 점수 계산
 */
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

/**
 * 전체 점수 계산 (메인 함수)
 */
export function calculateAllScores(
  fundamentals: FundamentalData,
  technicals: TechnicalData,
  newsData: NewsData,
  currentPrice: number,
  priceChange: number,
  sector?: string,
  weights?: WeightConfig
): StockScores {
  // 기본 가중치 (제공되지 않은 경우)
  const defaultWeights: WeightConfig = {
    fundamental: { per: 25, pbr: 25, roe: 25, operatingMargin: 25 },
    technical: { maPosition: 25, rsi: 25, volumeTrend: 25, macd: 25 },
    news: { sentiment: 50, frequency: 50 },
    category: { fundamental: 40, technical: 40, news: 20 },
  }

  const w = weights || defaultWeights

  // 각 카테고리별 점수 계산
  const fundamentalScores = calculateFundamentalScores(fundamentals, sector)
  const technicalScores = calculateTechnicalScores(technicals, currentPrice, priceChange)
  const newsScores = calculateNewsScores(newsData)

  // 가중 평균으로 카테고리별 최종 점수 계산
  const fundamentalWeightedAvg = calculateWeightedFundamentalScore(fundamentalScores, w.fundamental)
  const technicalWeightedAvg = calculateWeightedTechnicalScore(technicalScores, w.technical)
  const newsWeightedAvg = calculateWeightedNewsScore(newsScores, w.news)

  // 종합 점수 계산
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
    stock.currentPrice,
    stock.changePercent,
    stock.sector,
    weights
  )
}
