/**
 * 백테스트 시뮬레이션 엔진
 */

import type { PriceData } from '../../types'
import {
  calculateTechnicalScores,
  calculateWeightedScore,
  type IndicatorWeights,
} from './technicalIndicators'

export interface StockPriceData {
  symbol: string
  name: string
  priceHistory: PriceData[]
}

export interface Trade {
  date: string
  action: 'BUY' | 'SELL' | 'HOLD'
  symbol: string
  name: string
  price: number
  score: number
  portfolioValue: number
}

export interface BacktestResult {
  trades: Trade[]
  initialValue: number
  finalValue: number
  totalReturn: number        // 퍼센트
  benchmarkReturn: number    // 벤치마크 수익률
  excessReturn: number       // 초과 수익률
  winRate: number            // 승률 (수익 거래 / 전체 거래)
  maxDrawdown: number        // 최대 낙폭
  sharpeRatio: number        // 샤프 비율 (간략화)
  tradeCount: number
  holdingPeriods: { symbol: string; name: string; days: number; return: number }[]
}

export interface BacktestConfig {
  stocks: StockPriceData[]
  weights: IndicatorWeights
  evaluationPeriodDays: number  // 평가 기간 (일)
  rebalanceCycleDays: number    // 리밸런싱 주기 (일)
  initialCapital: number
}

/**
 * 백테스트 실행
 */
export function runBacktest(config: BacktestConfig): BacktestResult {
  const { stocks, weights, evaluationPeriodDays, rebalanceCycleDays, initialCapital } = config

  // 가장 긴 가격 히스토리 기준으로 날짜 인덱스 생성
  const allDates = new Set<string>()
  stocks.forEach(stock => {
    stock.priceHistory.forEach(p => allDates.add(p.date))
  })
  const sortedDates = Array.from(allDates).sort()

  if (sortedDates.length < evaluationPeriodDays) {
    return createEmptyResult(initialCapital)
  }

  // 시작 인덱스 (평가 기간 이전부터)
  const startDateIndex = Math.max(0, sortedDates.length - evaluationPeriodDays)
  const startDate = sortedDates[startDateIndex]

  // 리밸런싱 날짜들 계산
  const rebalanceDates: string[] = []
  for (let i = startDateIndex; i < sortedDates.length; i += rebalanceCycleDays) {
    rebalanceDates.push(sortedDates[i])
  }

  // 벤치마크 수익률 계산 (첫 종목 기준 또는 평균)
  const benchmarkReturn = calculateBenchmarkReturn(stocks, startDate, sortedDates[sortedDates.length - 1])

  // 시뮬레이션 실행
  const trades: Trade[] = []
  let cash = initialCapital
  let currentHolding: { symbol: string; name: string; shares: number; buyPrice: number; buyDate: string } | null = null
  let portfolioValues: number[] = [initialCapital]
  const holdingPeriods: { symbol: string; name: string; days: number; return: number }[] = []

  for (const rebalanceDate of rebalanceDates) {
    // 각 종목의 점수 계산
    const stockScores: { symbol: string; name: string; score: number; price: number }[] = []

    for (const stock of stocks) {
      const dateIndex = stock.priceHistory.findIndex(p => p.date === rebalanceDate)
      if (dateIndex < 0) continue

      // 해당 날짜까지의 데이터로 기술적 점수 계산
      const scores = calculateTechnicalScores(stock.priceHistory, dateIndex)
      const weightedScore = calculateWeightedScore(scores, weights)
      const price = stock.priceHistory[dateIndex].close

      stockScores.push({
        symbol: stock.symbol,
        name: stock.name,
        score: weightedScore,
        price,
      })
    }

    if (stockScores.length === 0) continue

    // 점수 기준 정렬하여 1위 찾기
    stockScores.sort((a, b) => b.score - a.score)
    const topStock = stockScores[0]

    // 현재 보유 종목과 비교
    if (currentHolding) {
      if (currentHolding.symbol === topStock.symbol) {
        // 같은 종목이면 HOLD
        const currentValue = currentHolding.shares * topStock.price
        trades.push({
          date: rebalanceDate,
          action: 'HOLD',
          symbol: topStock.symbol,
          name: topStock.name,
          price: topStock.price,
          score: topStock.score,
          portfolioValue: currentValue,
        })
        portfolioValues.push(currentValue)
      } else {
        // 다른 종목이면 SELL 후 BUY
        const sellPrice = topStock.price  // 현재 보유 종목의 현재가 찾기
        const holdingStock = stocks.find(s => s.symbol === currentHolding!.symbol)
        const holdingDateIndex = holdingStock?.priceHistory.findIndex(p => p.date === rebalanceDate) ?? -1
        const actualSellPrice = holdingDateIndex >= 0
          ? holdingStock!.priceHistory[holdingDateIndex].close
          : currentHolding.buyPrice

        const sellValue = currentHolding.shares * actualSellPrice

        // 보유 기간 기록
        const buyDateIdx = sortedDates.indexOf(currentHolding.buyDate)
        const sellDateIdx = sortedDates.indexOf(rebalanceDate)
        const holdDays = sellDateIdx - buyDateIdx
        const holdReturn = ((actualSellPrice - currentHolding.buyPrice) / currentHolding.buyPrice) * 100

        holdingPeriods.push({
          symbol: currentHolding.symbol,
          name: currentHolding.name,
          days: holdDays,
          return: holdReturn,
        })

        trades.push({
          date: rebalanceDate,
          action: 'SELL',
          symbol: currentHolding.symbol,
          name: currentHolding.name,
          price: actualSellPrice,
          score: 0,
          portfolioValue: sellValue,
        })

        cash = sellValue

        // 새 종목 매수
        const shares = cash / topStock.price
        trades.push({
          date: rebalanceDate,
          action: 'BUY',
          symbol: topStock.symbol,
          name: topStock.name,
          price: topStock.price,
          score: topStock.score,
          portfolioValue: cash,
        })

        currentHolding = {
          symbol: topStock.symbol,
          name: topStock.name,
          shares,
          buyPrice: topStock.price,
          buyDate: rebalanceDate,
        }

        portfolioValues.push(cash)
      }
    } else {
      // 첫 매수
      const shares = cash / topStock.price
      trades.push({
        date: rebalanceDate,
        action: 'BUY',
        symbol: topStock.symbol,
        name: topStock.name,
        price: topStock.price,
        score: topStock.score,
        portfolioValue: cash,
      })

      currentHolding = {
        symbol: topStock.symbol,
        name: topStock.name,
        shares,
        buyPrice: topStock.price,
        buyDate: rebalanceDate,
      }

      portfolioValues.push(cash)
    }
  }

  // 마지막 보유 종목 청산 가치 계산
  let finalValue = cash
  if (currentHolding) {
    const holdingStock = stocks.find(s => s.symbol === currentHolding!.symbol)
    if (holdingStock && holdingStock.priceHistory.length > 0) {
      const lastPrice = holdingStock.priceHistory[holdingStock.priceHistory.length - 1].close
      finalValue = currentHolding.shares * lastPrice

      // 마지막 보유 기간도 기록
      const buyDateIdx = sortedDates.indexOf(currentHolding.buyDate)
      const lastDateIdx = sortedDates.length - 1
      const holdDays = lastDateIdx - buyDateIdx
      const holdReturn = ((lastPrice - currentHolding.buyPrice) / currentHolding.buyPrice) * 100

      holdingPeriods.push({
        symbol: currentHolding.symbol,
        name: currentHolding.name,
        days: holdDays,
        return: holdReturn,
      })
    }
  }

  portfolioValues.push(finalValue)

  // 결과 계산
  const totalReturn = ((finalValue - initialCapital) / initialCapital) * 100
  const excessReturn = totalReturn - benchmarkReturn
  const winningTrades = holdingPeriods.filter(h => h.return > 0).length
  const winRate = holdingPeriods.length > 0 ? (winningTrades / holdingPeriods.length) * 100 : 0
  const maxDrawdown = calculateMaxDrawdown(portfolioValues)
  const sharpeRatio = calculateSharpeRatio(portfolioValues)

  return {
    trades,
    initialValue: initialCapital,
    finalValue,
    totalReturn,
    benchmarkReturn,
    excessReturn,
    winRate,
    maxDrawdown,
    sharpeRatio,
    tradeCount: trades.filter(t => t.action === 'BUY').length,
    holdingPeriods,
  }
}

/**
 * 빈 결과 생성
 */
function createEmptyResult(initialCapital: number): BacktestResult {
  return {
    trades: [],
    initialValue: initialCapital,
    finalValue: initialCapital,
    totalReturn: 0,
    benchmarkReturn: 0,
    excessReturn: 0,
    winRate: 0,
    maxDrawdown: 0,
    sharpeRatio: 0,
    tradeCount: 0,
    holdingPeriods: [],
  }
}

/**
 * 벤치마크 수익률 계산 (전체 종목 평균)
 */
function calculateBenchmarkReturn(stocks: StockPriceData[], startDate: string, endDate: string): number {
  let totalReturn = 0
  let count = 0

  for (const stock of stocks) {
    const startIdx = stock.priceHistory.findIndex(p => p.date >= startDate)
    const endIdx = stock.priceHistory.findIndex(p => p.date >= endDate)

    if (startIdx >= 0 && endIdx >= 0 && endIdx > startIdx) {
      const startPrice = stock.priceHistory[startIdx].close
      const endPrice = stock.priceHistory[endIdx].close
      totalReturn += ((endPrice - startPrice) / startPrice) * 100
      count++
    }
  }

  return count > 0 ? totalReturn / count : 0
}

/**
 * 최대 낙폭 계산
 */
function calculateMaxDrawdown(values: number[]): number {
  let maxDrawdown = 0
  let peak = values[0]

  for (const value of values) {
    if (value > peak) {
      peak = value
    }
    const drawdown = ((peak - value) / peak) * 100
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  }

  return maxDrawdown
}

/**
 * 샤프 비율 계산 (간략화)
 */
function calculateSharpeRatio(values: number[]): number {
  if (values.length < 2) return 0

  const returns: number[] = []
  for (let i = 1; i < values.length; i++) {
    returns.push((values[i] - values[i - 1]) / values[i - 1])
  }

  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
  const stdDev = Math.sqrt(variance)

  if (stdDev === 0) return 0

  // 무위험 수익률 0% 가정
  return (avgReturn / stdDev) * Math.sqrt(252)  // 연환산
}
