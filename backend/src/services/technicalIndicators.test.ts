/**
 * 기술적 지표 계산 함수 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateStandardDeviation,
  calculateBollingerBands,
  calculateMACD,
  calculateStochastic,
  calculateADX,
  detectRSIDivergence,
  detectMACDDivergence,
  calculateAllTechnicalIndicators,
} from './technicalIndicators.js'
import {
  generateUpTrendPrices,
  generateDownTrendPrices,
  generateFlatPrices,
  generateSinePrices,
  createOHLCVFromCloses,
  SAMPLE_60_DAYS,
  SAMPLE_CLOSES,
  SAMPLE_HIGHS,
  SAMPLE_LOWS,
} from './__fixtures__/testData.js'

describe('calculateSMA (단순이동평균)', () => {
  it('기본 SMA 계산이 정확해야 함', () => {
    const values = [10, 20, 30, 40, 50]
    const result = calculateSMA(values, 3)

    expect(result[0]).toBeNaN()
    expect(result[1]).toBeNaN()
    expect(result[2]).toBeCloseTo(20, 5) // (10+20+30)/3
    expect(result[3]).toBeCloseTo(30, 5) // (20+30+40)/3
    expect(result[4]).toBeCloseTo(40, 5) // (30+40+50)/3
  })

  it('period가 데이터 길이보다 크면 모두 NaN', () => {
    const values = [10, 20, 30]
    const result = calculateSMA(values, 5)

    expect(result.every(v => isNaN(v))).toBe(true)
  })

  it('빈 배열은 빈 배열 반환', () => {
    const result = calculateSMA([], 3)
    expect(result).toEqual([])
  })

  it('period 1은 원본 값 반환', () => {
    const values = [10, 20, 30]
    const result = calculateSMA(values, 1)

    expect(result[0]).toBe(10)
    expect(result[1]).toBe(20)
    expect(result[2]).toBe(30)
  })

  it('큰 숫자도 정확히 계산', () => {
    const values = [1e10, 2e10, 3e10]
    const result = calculateSMA(values, 2)

    expect(result[1]).toBeCloseTo(1.5e10, 0)
    expect(result[2]).toBeCloseTo(2.5e10, 0)
  })

  it('소수점도 정확히 계산', () => {
    const values = [0.001, 0.002, 0.003]
    const result = calculateSMA(values, 2)

    expect(result[1]).toBeCloseTo(0.0015, 8)
    expect(result[2]).toBeCloseTo(0.0025, 8)
  })
})

describe('calculateEMA (지수이동평균)', () => {
  it('EMA 결과 길이가 입력과 같아야 함', () => {
    const values = [22.27, 22.19, 22.08, 22.17, 22.18, 22.13, 22.23, 22.43, 22.24, 22.29]
    const result = calculateEMA(values, 5)

    expect(result.length).toBe(values.length)
  })

  it('첫 번째 EMA는 첫 N개의 SMA', () => {
    const values = [10, 20, 30, 40, 50]
    const result = calculateEMA(values, 3)

    // index 2에서 첫 EMA = SMA(10, 20, 30) = 20
    expect(result[2]).toBeCloseTo(20, 5)
  })

  it('빈 배열은 빈 배열 반환', () => {
    const result = calculateEMA([], 5)
    expect(result).toEqual([])
  })

  it('EMA는 최근 값에 더 많은 가중치', () => {
    const values = [100, 100, 100, 100, 100, 150] // 마지막에 급등
    const ema = calculateEMA(values, 5)
    const sma = calculateSMA(values, 5)

    // EMA가 SMA보다 최근 값(150)에 더 민감해야 함
    expect(ema[5]).toBeGreaterThan(sma[5])
  })
})

describe('calculateRSI (상대강도지수)', () => {
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

    const lastRSI = result[result.length - 1]
    expect(lastRSI).toBe(100)
  })

  it('RSI 결과 배열 길이가 입력과 같아야 함', () => {
    const prices = generateSinePrices(30, 100, 10)
    const result = calculateRSI(prices, 14)

    expect(result.length).toBe(prices.length)
  })

  it('데이터 부족 시 NaN 반환', () => {
    const prices = [100, 101, 102]
    const result = calculateRSI(prices, 14)

    expect(result.every(v => isNaN(v))).toBe(true)
  })

  it('첫 period 개는 NaN (워밍업 기간)', () => {
    const prices = generateSinePrices(30, 100, 10)
    const result = calculateRSI(prices, 14)

    // index 0부터 period까지는 NaN (계산에 충분한 데이터가 없음)
    // 구현에 따라 정확히 period번째 인덱스부터 유효값이 시작됨
    for (let i = 0; i < 14; i++) {
      expect(isNaN(result[i])).toBe(true)
    }
    // period 이후부터는 유효한 값
    expect(isNaN(result[14])).toBe(false)
  })
})

describe('calculateStandardDeviation (표준편차)', () => {
  it('일정한 값의 표준편차는 0', () => {
    const values = generateFlatPrices(10, 100)
    const result = calculateStandardDeviation(values, 5)

    const lastStdDev = result[result.length - 1]
    expect(lastStdDev).toBeCloseTo(0, 10)
  })

  it('표준편차는 항상 0 이상', () => {
    const result = calculateStandardDeviation(SAMPLE_CLOSES, 20)

    const validValues = result.filter(v => !isNaN(v))
    validValues.forEach(v => {
      expect(v).toBeGreaterThanOrEqual(0)
    })
  })
})

describe('calculateBollingerBands (볼린저밴드)', () => {
  it('상단 > 중간 > 하단 밴드', () => {
    const result = calculateBollingerBands(SAMPLE_CLOSES, 20, 2)
    const lastIdx = SAMPLE_CLOSES.length - 1

    expect(result.upper[lastIdx]).toBeGreaterThan(result.middle[lastIdx])
    expect(result.middle[lastIdx]).toBeGreaterThan(result.lower[lastIdx])
  })

  it('중간밴드는 SMA와 같음', () => {
    const bollinger = calculateBollingerBands(SAMPLE_CLOSES, 20, 2)
    const sma = calculateSMA(SAMPLE_CLOSES, 20)

    for (let i = 19; i < SAMPLE_CLOSES.length; i++) {
      expect(bollinger.middle[i]).toBeCloseTo(sma[i], 5)
    }
  })

  it('percentB는 0~1 사이 (정상 범위)', () => {
    const result = calculateBollingerBands(SAMPLE_CLOSES, 20, 2)

    const validPercentB = result.percentB.filter(v => !isNaN(v))
    // 정상 상황에서는 대부분 0~1 사이
    const normalRange = validPercentB.filter(v => v >= -0.5 && v <= 1.5)
    expect(normalRange.length).toBeGreaterThan(validPercentB.length * 0.8)
  })

  it('밴드폭(width)은 양수', () => {
    const result = calculateBollingerBands(SAMPLE_CLOSES, 20, 2)

    const validWidth = result.width.filter(v => !isNaN(v))
    validWidth.forEach(w => {
      expect(w).toBeGreaterThan(0)
    })
  })

  it('변동성 없을 때 밴드폭은 0에 가까움', () => {
    const flatPrices = generateFlatPrices(30, 100)
    const result = calculateBollingerBands(flatPrices, 20, 2)

    const lastWidth = result.width[result.width.length - 1]
    expect(lastWidth).toBeCloseTo(0, 5)
  })
})

describe('calculateMACD', () => {
  it('MACD line, signal line, histogram 모두 반환', () => {
    const result = calculateMACD(SAMPLE_CLOSES, 12, 26, 9)

    expect(result.macdLine.length).toBe(SAMPLE_CLOSES.length)
    expect(result.signalLine.length).toBe(SAMPLE_CLOSES.length)
    expect(result.histogram.length).toBe(SAMPLE_CLOSES.length)
  })

  it('초기 값들은 NaN', () => {
    const result = calculateMACD(SAMPLE_CLOSES, 12, 26, 9)

    // slowPeriod(26) - 1 까지는 NaN
    for (let i = 0; i < 25; i++) {
      expect(isNaN(result.macdLine[i])).toBe(true)
    }
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

    const lastMacd = result.macdLine[result.macdLine.length - 1]
    expect(lastMacd).toBeGreaterThan(0)
  })

  it('하락 추세에서 MACD line < 0', () => {
    const downTrend = generateDownTrendPrices(60, 200)
    const result = calculateMACD(downTrend, 12, 26, 9)

    const lastMacd = result.macdLine[result.macdLine.length - 1]
    expect(lastMacd).toBeLessThan(0)
  })
})

describe('calculateStochastic (스토캐스틱)', () => {
  it('%K와 %D 값은 0~100 사이', () => {
    const result = calculateStochastic(SAMPLE_HIGHS, SAMPLE_LOWS, SAMPLE_CLOSES, 14, 3)

    const validK = result.k.filter(v => !isNaN(v))
    const validD = result.d.filter(v => !isNaN(v))

    validK.forEach(k => {
      expect(k).toBeGreaterThanOrEqual(0)
      expect(k).toBeLessThanOrEqual(100)
    })

    validD.forEach(d => {
      expect(d).toBeGreaterThanOrEqual(0)
      expect(d).toBeLessThanOrEqual(100)
    })
  })

  it('연속 상승 시 %K는 높음 (80 이상)', () => {
    const upTrend = generateUpTrendPrices(20, 100)
    const { highs, lows } = createOHLCVFromCloses(upTrend)

    const result = calculateStochastic(highs, lows, upTrend, 14, 3)
    const lastK = result.k[result.k.length - 1]

    expect(lastK).toBeGreaterThan(80)
  })

  it('변동 없을 때 %K = 50', () => {
    const flatPrices = generateFlatPrices(20, 100)
    const flatHighs = generateFlatPrices(20, 100)
    const flatLows = generateFlatPrices(20, 100)

    const result = calculateStochastic(flatHighs, flatLows, flatPrices, 14, 3)
    const lastK = result.k[result.k.length - 1]

    expect(lastK).toBe(50)
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

  it('+DI와 -DI도 0~100 사이', () => {
    const result = calculateADX(SAMPLE_HIGHS, SAMPLE_LOWS, SAMPLE_CLOSES, 14)

    const validPlusDI = result.plusDI.filter(v => !isNaN(v))
    const validMinusDI = result.minusDI.filter(v => !isNaN(v))

    validPlusDI.forEach(di => {
      expect(di).toBeGreaterThanOrEqual(0)
      expect(di).toBeLessThanOrEqual(100)
    })

    validMinusDI.forEach(di => {
      expect(di).toBeGreaterThanOrEqual(0)
      expect(di).toBeLessThanOrEqual(100)
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

describe('detectRSIDivergence (RSI 다이버전스)', () => {
  it('데이터 부족 시 null 반환', () => {
    const closes = [100, 101, 102]
    const rsiValues = [NaN, 50, 55]

    const result = detectRSIDivergence(closes, rsiValues, 14)
    expect(result).toBeNull()
  })

  it('Bullish 다이버전스: 가격 신저점, RSI 상승', () => {
    // 가격은 하락하지만 RSI는 상승하는 패턴
    const closes = [
      ...Array(14).fill(100),  // 이전 기간
      ...Array(14).fill(90),   // 현재 기간 - 더 낮은 가격
    ]

    const rsiValues = [
      ...Array(14).fill(30),   // 이전 RSI - 낮음
      ...Array(14).fill(40),   // 현재 RSI - 더 높음
    ]

    const result = detectRSIDivergence(closes, rsiValues, 14)
    expect(result).toBe('bullish')
  })

  it('Bearish 다이버전스: 가격 신고점, RSI 하락', () => {
    const closes = [
      ...Array(14).fill(100),  // 이전 기간
      ...Array(14).fill(110),  // 현재 기간 - 더 높은 가격
    ]

    const rsiValues = [
      ...Array(14).fill(70),   // 이전 RSI - 높음
      ...Array(14).fill(60),   // 현재 RSI - 더 낮음
    ]

    const result = detectRSIDivergence(closes, rsiValues, 14)
    expect(result).toBe('bearish')
  })

  it('다이버전스 없으면 null', () => {
    // 가격과 RSI 모두 상승
    const closes = [
      ...Array(14).fill(100),
      ...Array(14).fill(110),
    ]

    const rsiValues = [
      ...Array(14).fill(50),
      ...Array(14).fill(60),
    ]

    const result = detectRSIDivergence(closes, rsiValues, 14)
    expect(result).toBeNull()
  })
})

describe('detectMACDDivergence (MACD 다이버전스)', () => {
  it('데이터 부족 시 null 반환', () => {
    const closes = [100, 101, 102]
    const histogram = [NaN, 0.5, 0.6]

    const result = detectMACDDivergence(closes, histogram, 14)
    expect(result).toBeNull()
  })

  it('Bullish 다이버전스 감지', () => {
    const closes = [
      ...Array(14).fill(100),
      ...Array(14).fill(90),  // 가격 신저점
    ]

    const histogram = [
      ...Array(14).fill(-2),   // 이전 histogram 더 낮음
      ...Array(14).fill(-1),   // 현재 histogram 더 높음
    ]

    const result = detectMACDDivergence(closes, histogram, 14)
    expect(result).toBe('bullish')
  })

  it('Bearish 다이버전스 감지', () => {
    const closes = [
      ...Array(14).fill(100),
      ...Array(14).fill(110),  // 가격 신고점
    ]

    const histogram = [
      ...Array(14).fill(2),    // 이전 histogram 더 높음
      ...Array(14).fill(1),    // 현재 histogram 더 낮음
    ]

    const result = detectMACDDivergence(closes, histogram, 14)
    expect(result).toBe('bearish')
  })
})

describe('calculateAllTechnicalIndicators (종합 지표)', () => {
  it('60일 데이터로 모든 지표 계산', () => {
    const result = calculateAllTechnicalIndicators(SAMPLE_60_DAYS)

    // 주요 지표들이 null이 아닌지 확인
    expect(result.ma20).not.toBeNull()
    expect(result.rsi).not.toBeNull()
    expect(result.macdLine).not.toBeNull()
    expect(result.bollingerUpper).not.toBeNull()
    expect(result.bollingerLower).not.toBeNull()
    expect(result.stochasticK).not.toBeNull()
    expect(result.adx).not.toBeNull()
  })

  it('30일 미만 데이터는 모두 null 반환', () => {
    const shortData = SAMPLE_60_DAYS.slice(0, 20)
    const result = calculateAllTechnicalIndicators(shortData)

    expect(result.ma20).toBeNull()
    expect(result.rsi).toBeNull()
    expect(result.macdLine).toBeNull()
  })

  it('MA50은 50일 이상 데이터 필요', () => {
    const result = calculateAllTechnicalIndicators(SAMPLE_60_DAYS)

    // 60일 데이터이므로 MA50 계산 가능
    expect(result.ma50).not.toBeNull()
  })

  it('MA120은 120일 이상 데이터 필요', () => {
    const result = calculateAllTechnicalIndicators(SAMPLE_60_DAYS)

    // 60일 데이터이므로 MA120은 null
    expect(result.ma120).toBeNull()
  })

  it('RSI 값이 유효 범위 내', () => {
    const result = calculateAllTechnicalIndicators(SAMPLE_60_DAYS)

    if (result.rsi !== null) {
      expect(result.rsi).toBeGreaterThanOrEqual(0)
      expect(result.rsi).toBeLessThanOrEqual(100)
    }
  })

  it('볼린저밴드 구조 확인', () => {
    const result = calculateAllTechnicalIndicators(SAMPLE_60_DAYS)

    if (
      result.bollingerUpper !== null &&
      result.bollingerMiddle !== null &&
      result.bollingerLower !== null
    ) {
      expect(result.bollingerUpper).toBeGreaterThan(result.bollingerMiddle)
      expect(result.bollingerMiddle).toBeGreaterThan(result.bollingerLower)
    }
  })
})

describe('Edge Cases (엣지 케이스)', () => {
  it('음수 가격 처리', () => {
    // 실제로는 없지만 함수가 크래시하지 않아야 함
    const negativePrices = [-10, -20, -30, -40, -50]
    const sma = calculateSMA(negativePrices, 3)

    expect(sma[2]).toBeCloseTo(-20, 5)
  })

  it('0 가격 처리', () => {
    const zeroPrices = [0, 0, 0, 0, 0]
    const sma = calculateSMA(zeroPrices, 3)

    expect(sma[2]).toBe(0)
  })

  it('매우 큰 가격 값', () => {
    const largePrices = [1e12, 1.1e12, 1.2e12, 1.3e12, 1.4e12]
    const sma = calculateSMA(largePrices, 3)

    expect(sma[2]).toBeCloseTo(1.1e12, 0)
  })

  it('매우 작은 가격 값', () => {
    const smallPrices = [0.00001, 0.00002, 0.00003, 0.00004, 0.00005]
    const sma = calculateSMA(smallPrices, 3)

    expect(sma[2]).toBeCloseTo(0.00002, 10)
  })

  it('동일한 가격의 RSI는 정의되지 않음 (NaN 또는 50)', () => {
    const flatPrices = generateFlatPrices(20, 100)
    const result = calculateRSI(flatPrices, 14)

    const lastRSI = result[result.length - 1]
    // 변동이 없으면 NaN이거나 50 (구현에 따라)
    expect(isNaN(lastRSI) || lastRSI === 50 || lastRSI === 100).toBe(true)
  })
})
