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
  topN: number                  // 상위 N개 종목 보유
}

/**
 * 특정 날짜 이전의 가장 가까운 데이터 인덱스 찾기
 */
function findClosestDateIndex(priceHistory: PriceData[], targetDate: string): number {
  // 정확한 날짜 먼저 찾기
  const exactIndex = priceHistory.findIndex(p => p.date === targetDate)
  if (exactIndex >= 0) return exactIndex

  // 없으면 targetDate 이전의 가장 가까운 날짜 찾기
  for (let i = priceHistory.length - 1; i >= 0; i--) {
    if (priceHistory[i].date <= targetDate) {
      return i
    }
  }

  return -1
}

interface Holding {
  symbol: string
  name: string
  shares: number
  buyPrice: number
  buyDate: string
}

/**
 * 백테스트 실행
 */
export function runBacktest(config: BacktestConfig): BacktestResult {
  const { stocks, weights, evaluationPeriodDays, rebalanceCycleDays, initialCapital, topN = 1 } = config

  console.log('[Backtest] Starting with', stocks.length, 'stocks, Top N:', topN)
  console.log('[Backtest] Evaluation period:', evaluationPeriodDays, 'days, Rebalance cycle:', rebalanceCycleDays, 'days')

  // 모든 종목의 공통 거래일만 사용
  // 가장 짧은 히스토리 기준으로 날짜 범위 결정
  let minLength = Infinity
  let shortestStock = stocks[0]

  for (const stock of stocks) {
    if (stock.priceHistory.length < minLength) {
      minLength = stock.priceHistory.length
      shortestStock = stock
    }
  }

  if (minLength < 20) {
    console.log('[Backtest] Not enough price data. Min length:', minLength)
    return createEmptyResult(initialCapital)
  }

  // 기준 종목의 날짜 사용
  const baseDates = shortestStock.priceHistory.map(p => p.date)
  console.log('[Backtest] Using', baseDates.length, 'dates from', baseDates[0], 'to', baseDates[baseDates.length - 1])

  // 시작 인덱스 (평가 기간 이전부터)
  const actualEvalPeriod = Math.min(evaluationPeriodDays, baseDates.length - 20) // 최소 20일 데이터 필요
  const startDateIndex = Math.max(0, baseDates.length - actualEvalPeriod)
  const startDate = baseDates[startDateIndex]

  console.log('[Backtest] Start date index:', startDateIndex, 'Start date:', startDate)

  // 리밸런싱 날짜들 계산
  const rebalanceDates: string[] = []
  for (let i = startDateIndex; i < baseDates.length; i += rebalanceCycleDays) {
    rebalanceDates.push(baseDates[i])
  }

  console.log('[Backtest] Rebalance dates:', rebalanceDates.length)

  // 벤치마크 수익률 계산 (첫 종목 기준 또는 평균)
  const endDate = baseDates[baseDates.length - 1]
  const benchmarkReturn = calculateBenchmarkReturn(stocks, startDate, endDate)

  // 시뮬레이션 실행
  const trades: Trade[] = []
  let cash = initialCapital
  let currentHoldings: Holding[] = []
  let portfolioValues: number[] = [initialCapital]
  const holdingPeriods: { symbol: string; name: string; days: number; return: number }[] = []

  // 현재가 조회 헬퍼
  const getCurrentPrice = (symbol: string, date: string): number | null => {
    const stock = stocks.find(s => s.symbol === symbol)
    if (!stock) return null
    const idx = findClosestDateIndex(stock.priceHistory, date)
    if (idx < 0) return null
    return stock.priceHistory[idx].close
  }

  // 포트폴리오 총 가치 계산
  const getPortfolioValue = (date: string): number => {
    let value = cash
    for (const holding of currentHoldings) {
      const price = getCurrentPrice(holding.symbol, date)
      if (price) {
        value += holding.shares * price
      }
    }
    return value
  }

  for (const rebalanceDate of rebalanceDates) {
    // 각 종목의 점수 계산
    const stockScores: { symbol: string; name: string; score: number; price: number }[] = []

    for (const stock of stocks) {
      const dateIndex = findClosestDateIndex(stock.priceHistory, rebalanceDate)
      if (dateIndex < 10) continue  // 최소 10일 데이터 필요

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

    if (stockScores.length === 0) {
      console.log('[Backtest] No valid stocks for date:', rebalanceDate)
      continue
    }

    // 점수 기준 정렬하여 상위 N개 선택
    stockScores.sort((a, b) => b.score - a.score)
    const targetStocks = stockScores.slice(0, Math.min(topN, stockScores.length))
    const targetSymbols = new Set(targetStocks.map(s => s.symbol))

    console.log('[Backtest]', rebalanceDate, 'Top', topN, ':', targetStocks.map(s => s.name).join(', '))

    // 1. 상위 N에서 빠진 종목 매도
    const holdingsToSell = currentHoldings.filter(h => !targetSymbols.has(h.symbol))
    for (const holding of holdingsToSell) {
      const sellPrice = getCurrentPrice(holding.symbol, rebalanceDate) || holding.buyPrice
      const sellValue = holding.shares * sellPrice

      // 보유 기간 기록
      const buyDateIdx = baseDates.indexOf(holding.buyDate)
      const sellDateIdx = baseDates.indexOf(rebalanceDate)
      const holdDays = Math.max(1, sellDateIdx - buyDateIdx)
      const holdReturn = ((sellPrice - holding.buyPrice) / holding.buyPrice) * 100

      holdingPeriods.push({
        symbol: holding.symbol,
        name: holding.name,
        days: holdDays,
        return: holdReturn,
      })

      trades.push({
        date: rebalanceDate,
        action: 'SELL',
        symbol: holding.symbol,
        name: holding.name,
        price: sellPrice,
        score: 0,
        portfolioValue: sellValue,
      })

      cash += sellValue
    }

    // 보유 목록에서 매도한 종목 제거
    currentHoldings = currentHoldings.filter(h => targetSymbols.has(h.symbol))

    // 2. 기존 보유 종목은 HOLD
    for (const holding of currentHoldings) {
      const currentPrice = getCurrentPrice(holding.symbol, rebalanceDate) || holding.buyPrice
      const targetStock = targetStocks.find(s => s.symbol === holding.symbol)
      trades.push({
        date: rebalanceDate,
        action: 'HOLD',
        symbol: holding.symbol,
        name: holding.name,
        price: currentPrice,
        score: targetStock?.score || 0,
        portfolioValue: holding.shares * currentPrice,
      })
    }

    // 3. 새로 진입할 종목 매수 (동일 비중)
    const currentHoldingSymbols = new Set(currentHoldings.map(h => h.symbol))
    const stocksToBuy = targetStocks.filter(s => !currentHoldingSymbols.has(s.symbol))

    if (stocksToBuy.length > 0 && cash > 0) {
      // 목표: 모든 보유 종목이 동일 비중이 되도록
      // 현재 포트폴리오 가치 계산
      const totalValue = getPortfolioValue(rebalanceDate)
      const targetValuePerStock = totalValue / topN
      const cashPerNewStock = cash / stocksToBuy.length

      for (const stock of stocksToBuy) {
        const buyAmount = Math.min(cashPerNewStock, targetValuePerStock)
        if (buyAmount <= 0) continue

        const shares = buyAmount / stock.price

        trades.push({
          date: rebalanceDate,
          action: 'BUY',
          symbol: stock.symbol,
          name: stock.name,
          price: stock.price,
          score: stock.score,
          portfolioValue: buyAmount,
        })

        currentHoldings.push({
          symbol: stock.symbol,
          name: stock.name,
          shares,
          buyPrice: stock.price,
          buyDate: rebalanceDate,
        })

        cash -= buyAmount
      }
    }

    portfolioValues.push(getPortfolioValue(rebalanceDate))
  }

  // 마지막 보유 종목들의 청산 가치 계산
  let finalValue = cash
  const lastDate = baseDates[baseDates.length - 1]

  for (const holding of currentHoldings) {
    const lastPrice = getCurrentPrice(holding.symbol, lastDate) || holding.buyPrice
    finalValue += holding.shares * lastPrice

    // 마지막 보유 기간도 기록
    const buyDateIdx = baseDates.indexOf(holding.buyDate)
    const lastDateIdx = baseDates.length - 1
    const holdDays = Math.max(1, lastDateIdx - buyDateIdx)
    const holdReturn = ((lastPrice - holding.buyPrice) / holding.buyPrice) * 100

    holdingPeriods.push({
      symbol: holding.symbol,
      name: holding.name,
      days: holdDays,
      return: holdReturn,
    })
  }

  console.log('[Backtest] Final value:', finalValue, 'Trades:', trades.length, 'Holdings:', currentHoldings.length)

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
