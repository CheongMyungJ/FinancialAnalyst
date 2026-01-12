/**
 * 기술적 지표 계산 함수 테스트 (Frontend)
 */

import { describe, it, expect } from 'vitest'
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateBollingerBands,
  calculateMACD,
  calculateStochastic,
  calculateADX,
} from './technicalIndicators'
import {
  generateUpTrendPrices,
  generateFlatPrices,
  generateSinePrices,
  createOHLCVFromCloses,
  SAMPLE_CLOSES,
  SAMPLE_HIGHS,
  SAMPLE_LOWS,
} from '../__fixtures__/testData'

describe('calculateSMA', () => {
  it('기본 SMA 계산이 정확해야 함', () => {
    const values = [10, 20, 30, 40, 50]
    const result = calculateSMA(values, 3)

    expect(result[2]).toBeCloseTo(20, 5)
    expect(result[4]).toBeCloseTo(40, 5)
  })

  it('빈 배열은 빈 배열 반환', () => {
    expect(calculateSMA([], 3)).toEqual([])
  })

  it('period 1은 원본 값 반환', () => {
    const values = [10, 20, 30]
    const result = calculateSMA(values, 1)
    expect(result).toEqual([10, 20, 30])
  })
})

describe('calculateEMA', () => {
  it('EMA 결과 길이가 입력과 같아야 함', () => {
    const values = generateSinePrices(20, 100, 10)
    const result = calculateEMA(values, 5)
    expect(result.length).toBe(values.length)
  })

  it('EMA는 최근 값에 더 많은 가중치', () => {
    const values = [100, 100, 100, 100, 100, 150]
    const ema = calculateEMA(values, 5)
    const sma = calculateSMA(values, 5)
    expect(ema[5]).toBeGreaterThan(sma[5])
  })
})

describe('calculateRSI', () => {
  it('RSI 값은 0과 100 사이', () => {
    const result = calculateRSI(SAMPLE_CLOSES, 14)
    const validRSI = result.filter(v => !isNaN(v))
    validRSI.forEach(rsi => {
      expect(rsi).toBeGreaterThanOrEqual(0)
      expect(rsi).toBeLessThanOrEqual(100)
    })
  })

  it('연속 상승 시 RSI = 100', () => {
    const prices = generateUpTrendPrices(20, 100)
    const result = calculateRSI(prices, 14)
    expect(result[result.length - 1]).toBe(100)
  })
})

describe('calculateBollingerBands', () => {
  it('상단 > 중간 > 하단 밴드', () => {
    const result = calculateBollingerBands(SAMPLE_CLOSES, 20, 2)
    const lastIdx = SAMPLE_CLOSES.length - 1

    expect(result.upper[lastIdx]).toBeGreaterThan(result.middle[lastIdx])
    expect(result.middle[lastIdx]).toBeGreaterThan(result.lower[lastIdx])
  })

  it('밴드폭(width)은 양수', () => {
    const result = calculateBollingerBands(SAMPLE_CLOSES, 20, 2)
    const validWidth = result.width.filter(v => !isNaN(v))
    validWidth.forEach(w => expect(w).toBeGreaterThan(0))
  })

  it('변동성 없을 때 밴드폭은 0에 가까움', () => {
    const flatPrices = generateFlatPrices(30, 100)
    const result = calculateBollingerBands(flatPrices, 20, 2)
    expect(result.width[result.width.length - 1]).toBeCloseTo(0, 5)
  })
})

describe('calculateMACD', () => {
  it('MACD line, signal line, histogram 모두 반환', () => {
    const result = calculateMACD(SAMPLE_CLOSES, 12, 26, 9)

    expect(result.macdLine.length).toBe(SAMPLE_CLOSES.length)
    expect(result.signalLine.length).toBe(SAMPLE_CLOSES.length)
    expect(result.histogram.length).toBe(SAMPLE_CLOSES.length)
  })

  it('histogram = macdLine - signalLine', () => {
    const result = calculateMACD(SAMPLE_CLOSES, 12, 26, 9)

    for (let i = 34; i < SAMPLE_CLOSES.length; i++) {
      if (!isNaN(result.macdLine[i]) && !isNaN(result.signalLine[i])) {
        expect(result.histogram[i]).toBeCloseTo(
          result.macdLine[i] - result.signalLine[i],
          5
        )
      }
    }
  })

  it('상승 추세에서 MACD line > 0', () => {
    const upTrend = generateUpTrendPrices(60, 100)
    const result = calculateMACD(upTrend, 12, 26, 9)
    expect(result.macdLine[result.macdLine.length - 1]).toBeGreaterThan(0)
  })
})

describe('calculateStochastic', () => {
  it('%K와 %D 값은 0~100 사이', () => {
    const result = calculateStochastic(SAMPLE_HIGHS, SAMPLE_LOWS, SAMPLE_CLOSES, 14, 3)

    const validK = result.k.filter(v => !isNaN(v))
    validK.forEach(k => {
      expect(k).toBeGreaterThanOrEqual(0)
      expect(k).toBeLessThanOrEqual(100)
    })
  })

  it('연속 상승 시 %K는 높음', () => {
    const upTrend = generateUpTrendPrices(20, 100)
    const { highs, lows } = createOHLCVFromCloses(upTrend)
    const result = calculateStochastic(highs, lows, upTrend, 14, 3)
    expect(result.k[result.k.length - 1]).toBeGreaterThan(80)
  })

  it('변동 없을 때 %K = 50', () => {
    const flatPrices = generateFlatPrices(20, 100)
    const result = calculateStochastic(flatPrices, flatPrices, flatPrices, 14, 3)
    expect(result.k[result.k.length - 1]).toBe(50)
  })
})

describe('calculateADX', () => {
  it('ADX, +DI, -DI 모두 반환', () => {
    const result = calculateADX(SAMPLE_HIGHS, SAMPLE_LOWS, SAMPLE_CLOSES, 14)

    expect(result.adx.length).toBe(SAMPLE_CLOSES.length)
    expect(result.plusDI.length).toBe(SAMPLE_CLOSES.length)
    expect(result.minusDI.length).toBe(SAMPLE_CLOSES.length)
  })

  it('ADX 값은 0~100 사이', () => {
    const result = calculateADX(SAMPLE_HIGHS, SAMPLE_LOWS, SAMPLE_CLOSES, 14)
    const validADX = result.adx.filter(v => !isNaN(v))
    validADX.forEach(adx => {
      expect(adx).toBeGreaterThanOrEqual(0)
      expect(adx).toBeLessThanOrEqual(100)
    })
  })

  it('상승 추세에서 +DI > -DI', () => {
    const upTrend = generateUpTrendPrices(30, 100)
    const { highs, lows } = createOHLCVFromCloses(upTrend)
    const result = calculateADX(highs, lows, upTrend, 14)
    const lastIdx = upTrend.length - 1
    expect(result.plusDI[lastIdx]).toBeGreaterThan(result.minusDI[lastIdx])
  })
})
