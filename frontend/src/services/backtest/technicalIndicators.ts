/**
 * 기술적 지표 계산 서비스
 * 과거 가격 데이터로부터 기술적 지표를 계산합니다.
 */

import type { PriceData, SupplyDemandData } from '../../types'

export interface TechnicalScores {
  rsi: number          // 0-10 (RSI 기반)
  macd: number         // 0-10 (MACD 시그널)
  maCrossover: number  // 0-10 (이동평균 크로스오버)
  momentum: number     // 0-10 (모멘텀)
  volumeTrend: number  // 0-10 (거래량 추세)
  bollingerBand: number // 0-10 (볼린저 밴드)
  stochastic: number   // 0-10 (스토캐스틱)
  adx: number          // 0-10 (ADX 추세 강도)
  divergence: number   // 0-10 (다이버전스)
  foreignFlow: number  // 0-10 (외국인 수급)
  institutionFlow: number // 0-10 (기관 수급)
}

export interface IndicatorWeights {
  rsi: number
  macd: number
  maCrossover: number
  momentum: number
  volumeTrend: number
  bollingerBand: number
  stochastic: number
  adx: number
  divergence: number
  foreignFlow: number
  institutionFlow: number
}

export const DEFAULT_WEIGHTS: IndicatorWeights = {
  rsi: 10,
  macd: 10,
  maCrossover: 10,
  momentum: 10,
  volumeTrend: 8,
  bollingerBand: 8,
  stochastic: 8,
  adx: 8,
  divergence: 8,
  foreignFlow: 10,
  institutionFlow: 10,
}

/**
 * RSI (Relative Strength Index) 계산
 */
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50

  let gains = 0
  let losses = 0

  for (let i = prices.length - period; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1]
    if (change > 0) gains += change
    else losses -= change
  }

  const avgGain = gains / period
  const avgLoss = losses / period

  if (avgLoss === 0) return 100
  const rs = avgGain / avgLoss
  return 100 - (100 / (1 + rs))
}

/**
 * RSI를 0-10 점수로 변환
 * RSI 30 이하: 과매도 (매수 신호) -> 높은 점수
 * RSI 70 이상: 과매수 (매도 신호) -> 낮은 점수
 */
function rsiToScore(rsi: number): number {
  if (rsi <= 30) return 10
  if (rsi >= 70) return 0
  if (rsi <= 50) return 5 + (50 - rsi) / 4  // 30-50: 5-10
  return 5 - (rsi - 50) / 4                  // 50-70: 0-5
}

/**
 * EMA (Exponential Moving Average) 계산
 */
function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = []
  const multiplier = 2 / (period + 1)

  // 첫 EMA는 SMA로 시작
  let sum = 0
  for (let i = 0; i < Math.min(period, prices.length); i++) {
    sum += prices[i]
  }
  ema.push(sum / Math.min(period, prices.length))

  // 이후 EMA 계산
  for (let i = period; i < prices.length; i++) {
    const newEma = (prices[i] - ema[ema.length - 1]) * multiplier + ema[ema.length - 1]
    ema.push(newEma)
  }

  return ema
}

/**
 * MACD 계산
 */
function calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
  if (prices.length < 26) {
    return { macd: 0, signal: 0, histogram: 0 }
  }

  const ema12 = calculateEMA(prices, 12)
  const ema26 = calculateEMA(prices, 26)

  // MACD Line = EMA12 - EMA26
  const macdLine: number[] = []
  const offset = ema12.length - ema26.length
  for (let i = 0; i < ema26.length; i++) {
    macdLine.push(ema12[i + offset] - ema26[i])
  }

  // Signal Line = 9일 EMA of MACD
  const signalLine = calculateEMA(macdLine, 9)

  const macd = macdLine[macdLine.length - 1] || 0
  const signal = signalLine[signalLine.length - 1] || 0
  const histogram = macd - signal

  return { macd, signal, histogram }
}

/**
 * MACD를 0-10 점수로 변환
 */
function macdToScore(histogram: number, price: number): number {
  // 히스토그램을 가격 대비 비율로 정규화
  const normalizedHist = (histogram / price) * 100

  if (normalizedHist > 2) return 10
  if (normalizedHist < -2) return 0
  return 5 + normalizedHist * 2.5
}

/**
 * 이동평균 크로스오버 점수
 */
function calculateMACrossoverScore(prices: number[]): number {
  if (prices.length < 50) return 5

  // 20일, 50일 이동평균
  const ma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20
  const ma50 = prices.slice(-50).reduce((a, b) => a + b, 0) / 50
  const currentPrice = prices[prices.length - 1]

  // 현재가가 두 MA 위에 있고, 단기 MA가 장기 MA 위에 있으면 강세
  let score = 5

  if (currentPrice > ma20) score += 1.5
  if (currentPrice > ma50) score += 1.5
  if (ma20 > ma50) score += 2

  // 반대의 경우
  if (currentPrice < ma20) score -= 1.5
  if (currentPrice < ma50) score -= 1.5
  if (ma20 < ma50) score -= 2

  return Math.max(0, Math.min(10, score))
}

/**
 * 모멘텀 점수 (최근 N일 수익률)
 */
function calculateMomentumScore(prices: number[], period: number = 20): number {
  if (prices.length < period) return 5

  const oldPrice = prices[prices.length - period]
  const currentPrice = prices[prices.length - 1]
  const change = ((currentPrice - oldPrice) / oldPrice) * 100

  // -20% ~ +20% 를 0-10으로 매핑
  if (change >= 20) return 10
  if (change <= -20) return 0
  return 5 + change / 4
}

/**
 * 거래량 추세 점수
 */
function calculateVolumeTrendScore(volumes: number[]): number {
  if (volumes.length < 20) return 5

  // 최근 5일 평균 vs 20일 평균
  const recent5 = volumes.slice(-5).reduce((a, b) => a + b, 0) / 5
  const avg20 = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20

  if (avg20 === 0) return 5

  const ratio = recent5 / avg20

  // 거래량 증가는 긍정적 신호
  if (ratio >= 2) return 10
  if (ratio <= 0.5) return 2
  return 2 + (ratio - 0.5) * (8 / 1.5)
}

/**
 * 볼린저 밴드 점수 계산
 */
function calculateBollingerBandScore(prices: number[]): number {
  if (prices.length < 20) return 5

  const period = 20
  const recentPrices = prices.slice(-period)
  const sma = recentPrices.reduce((a, b) => a + b, 0) / period

  // 표준편차 계산
  const variance = recentPrices.reduce((sum, p) => sum + Math.pow(p - sma, 2), 0) / period
  const stdDev = Math.sqrt(variance)

  const upperBand = sma + 2 * stdDev
  const lowerBand = sma - 2 * stdDev
  const currentPrice = prices[prices.length - 1]

  // 밴드 내 위치 계산 (0 = 하단, 1 = 상단)
  const bandWidth = upperBand - lowerBand
  if (bandWidth === 0) return 5

  const position = (currentPrice - lowerBand) / bandWidth

  // 하단 근처: 매수 기회 (높은 점수), 상단 근처: 매도 고려 (낮은 점수)
  if (position <= 0.1) return 9  // 하단 돌파 - 강한 매수 신호
  if (position <= 0.3) return 7  // 하단 근처
  if (position >= 0.9) return 2  // 상단 돌파 - 매도 신호
  if (position >= 0.7) return 4  // 상단 근처
  return 5  // 중간
}

/**
 * 스토캐스틱 계산 및 점수화
 */
function calculateStochasticScore(prices: number[]): number {
  if (prices.length < 14) return 5

  const period = 14
  const recentPrices = prices.slice(-period)
  const high = Math.max(...recentPrices)
  const low = Math.min(...recentPrices)
  const current = prices[prices.length - 1]

  if (high === low) return 5

  const percentK = ((current - low) / (high - low)) * 100

  // 과매도 (20 미만): 매수 신호 -> 높은 점수
  // 과매수 (80 이상): 매도 신호 -> 낮은 점수
  if (percentK <= 20) return 8
  if (percentK <= 30) return 7
  if (percentK >= 80) return 3
  if (percentK >= 70) return 4
  return 5 + (50 - percentK) / 20  // 50 근처에서 5점
}

/**
 * ADX (Average Directional Index) 점수 계산
 */
function calculateADXScore(prices: number[]): number {
  if (prices.length < 28) return 5

  const period = 14

  // +DM, -DM, TR 계산
  const plusDM: number[] = []
  const minusDM: number[] = []
  const tr: number[] = []

  for (let i = 1; i < prices.length; i++) {
    const high = prices[i]
    const low = prices[i]
    const prevHigh = prices[i - 1]
    const prevLow = prices[i - 1]
    const prevClose = prices[i - 1]

    const upMove = high - prevHigh
    const downMove = prevLow - low

    plusDM.push(upMove > downMove && upMove > 0 ? upMove : 0)
    minusDM.push(downMove > upMove && downMove > 0 ? downMove : 0)
    tr.push(Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)))
  }

  if (plusDM.length < period) return 5

  // 14일 평균 계산
  const avgPlusDM = plusDM.slice(-period).reduce((a, b) => a + b, 0) / period
  const avgMinusDM = minusDM.slice(-period).reduce((a, b) => a + b, 0) / period
  const avgTR = tr.slice(-period).reduce((a, b) => a + b, 0) / period

  if (avgTR === 0) return 5

  const plusDI = (avgPlusDM / avgTR) * 100
  const minusDI = (avgMinusDM / avgTR) * 100
  const diSum = plusDI + minusDI

  if (diSum === 0) return 5

  const dx = Math.abs(plusDI - minusDI) / diSum * 100

  // ADX가 25 이상이면 추세가 강함
  // +DI > -DI면 상승 추세, 반대면 하락 추세
  const isUptrend = plusDI > minusDI

  if (dx >= 25) {
    return isUptrend ? 8 : 3  // 강한 추세
  }
  return isUptrend ? 6 : 4  // 약한 추세
}

/**
 * 다이버전스 점수 계산 (가격과 RSI 비교)
 */
function calculateDivergenceScore(prices: number[]): number {
  if (prices.length < 30) return 5

  // 최근 20일 데이터로 다이버전스 감지
  const period = 20
  const recentPrices = prices.slice(-period)

  // 가격의 고점/저점 추세
  const priceStart = recentPrices.slice(0, 5).reduce((a, b) => a + b, 0) / 5
  const priceEnd = recentPrices.slice(-5).reduce((a, b) => a + b, 0) / 5
  const priceTrend = priceEnd - priceStart

  // RSI 추세 계산
  const rsiStart = calculateRSI(prices.slice(0, -period + 5))
  const rsiEnd = calculateRSI(prices)
  const rsiTrend = rsiEnd - rsiStart

  // 상승 다이버전스: 가격 하락 + RSI 상승 (매수 신호)
  if (priceTrend < 0 && rsiTrend > 5) return 8

  // 하락 다이버전스: 가격 상승 + RSI 하락 (매도 신호)
  if (priceTrend > 0 && rsiTrend < -5) return 3

  return 5  // 다이버전스 없음
}

/**
 * 외국인 수급 점수 계산
 */
function calculateForeignFlowScore(supplyDemand?: SupplyDemandData): number {
  if (!supplyDemand) return 5

  let score = 5

  // 순매수 금액 기반
  if (supplyDemand.foreignNetBuy != null) {
    if (supplyDemand.foreignNetBuy > 50) score += 2
    else if (supplyDemand.foreignNetBuy > 0) score += 1
    else if (supplyDemand.foreignNetBuy < -50) score -= 2
    else if (supplyDemand.foreignNetBuy < 0) score -= 1
  }

  // 연속 순매수 일수 기반
  if (supplyDemand.foreignNetBuyDays != null) {
    if (supplyDemand.foreignNetBuyDays >= 5) score += 2
    else if (supplyDemand.foreignNetBuyDays >= 3) score += 1
    else if (supplyDemand.foreignNetBuyDays <= -5) score -= 2
    else if (supplyDemand.foreignNetBuyDays <= -3) score -= 1
  }

  // 외국인 지분율 높으면 가산점
  if (supplyDemand.foreignOwnership != null && supplyDemand.foreignOwnership > 30) {
    score += 1
  }

  return Math.max(0, Math.min(10, score))
}

/**
 * 기관 수급 점수 계산
 */
function calculateInstitutionFlowScore(supplyDemand?: SupplyDemandData): number {
  if (!supplyDemand) return 5

  let score = 5

  // 순매수 금액 기반
  if (supplyDemand.institutionNetBuy != null) {
    if (supplyDemand.institutionNetBuy > 50) score += 2
    else if (supplyDemand.institutionNetBuy > 0) score += 1
    else if (supplyDemand.institutionNetBuy < -50) score -= 2
    else if (supplyDemand.institutionNetBuy < 0) score -= 1
  }

  // 연속 순매수 일수 기반
  if (supplyDemand.institutionNetBuyDays != null) {
    if (supplyDemand.institutionNetBuyDays >= 5) score += 2
    else if (supplyDemand.institutionNetBuyDays >= 3) score += 1
    else if (supplyDemand.institutionNetBuyDays <= -5) score -= 2
    else if (supplyDemand.institutionNetBuyDays <= -3) score -= 1
  }

  return Math.max(0, Math.min(10, score))
}

/**
 * 특정 시점의 기술적 점수 계산
 */
export function calculateTechnicalScores(
  priceData: PriceData[],
  endIndex: number,  // 이 인덱스까지의 데이터만 사용
  supplyDemand?: SupplyDemandData  // 수급 데이터 (선택)
): TechnicalScores {
  const data = priceData.slice(0, endIndex + 1)
  const closes = data.map(d => d.close)
  const volumes = data.map(d => d.volume)

  if (closes.length < 5) {
    return {
      rsi: 5, macd: 5, maCrossover: 5, momentum: 5, volumeTrend: 5,
      bollingerBand: 5, stochastic: 5, adx: 5, divergence: 5,
      foreignFlow: 5, institutionFlow: 5
    }
  }

  const rsiValue = calculateRSI(closes)
  const macdData = calculateMACD(closes)
  const currentPrice = closes[closes.length - 1]

  return {
    rsi: rsiToScore(rsiValue),
    macd: macdToScore(macdData.histogram, currentPrice),
    maCrossover: calculateMACrossoverScore(closes),
    momentum: calculateMomentumScore(closes),
    volumeTrend: calculateVolumeTrendScore(volumes),
    bollingerBand: calculateBollingerBandScore(closes),
    stochastic: calculateStochasticScore(closes),
    adx: calculateADXScore(closes),
    divergence: calculateDivergenceScore(closes),
    foreignFlow: calculateForeignFlowScore(supplyDemand),
    institutionFlow: calculateInstitutionFlowScore(supplyDemand),
  }
}

/**
 * 가중 평균 점수 계산
 */
export function calculateWeightedScore(
  scores: TechnicalScores,
  weights: IndicatorWeights
): number {
  const totalWeight =
    weights.rsi +
    weights.macd +
    weights.maCrossover +
    weights.momentum +
    weights.volumeTrend +
    weights.bollingerBand +
    weights.stochastic +
    weights.adx +
    weights.divergence +
    weights.foreignFlow +
    weights.institutionFlow

  if (totalWeight === 0) return 0

  const weightedSum =
    scores.rsi * weights.rsi +
    scores.macd * weights.macd +
    scores.maCrossover * weights.maCrossover +
    scores.momentum * weights.momentum +
    scores.volumeTrend * weights.volumeTrend +
    scores.bollingerBand * weights.bollingerBand +
    scores.stochastic * weights.stochastic +
    scores.adx * weights.adx +
    scores.divergence * weights.divergence +
    scores.foreignFlow * weights.foreignFlow +
    scores.institutionFlow * weights.institutionFlow

  return weightedSum / totalWeight
}
