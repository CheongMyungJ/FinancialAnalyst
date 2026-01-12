/**
 * 데모용 가격 히스토리 데이터 생성
 */

interface PriceHistoryItem {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
  ma20?: number
  ma50?: number
}

/**
 * 가상의 가격 히스토리 생성
 */
export function generatePriceHistory(
  basePrice: number,
  days: number = 180,
  volatility: number = 0.02
): PriceHistoryItem[] {
  const history: PriceHistoryItem[] = []
  let currentPrice = basePrice * (1 - volatility * days * 0.1) // 과거 가격부터 시작

  const today = new Date()

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)

    // 랜덤 변동 (-volatility ~ +volatility)
    const change = (Math.random() - 0.45) * volatility * 2 // 약간의 상승 편향
    currentPrice = currentPrice * (1 + change)

    const dayVolatility = Math.random() * volatility
    const open = currentPrice * (1 + (Math.random() - 0.5) * dayVolatility)
    const close = currentPrice
    const high = Math.max(open, close) * (1 + Math.random() * dayVolatility)
    const low = Math.min(open, close) * (1 - Math.random() * dayVolatility)

    // 기본 거래량 + 랜덤 변동
    const baseVolume = 1000000 + Math.random() * 500000
    const volume = Math.floor(baseVolume * (0.5 + Math.random()))

    history.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    })
  }

  // 이동평균 계산
  for (let i = 0; i < history.length; i++) {
    if (i >= 19) {
      const ma20 = history.slice(i - 19, i + 1).reduce((sum, item) => sum + item.close, 0) / 20
      history[i].ma20 = Math.round(ma20 * 100) / 100
    }
    if (i >= 49) {
      const ma50 = history.slice(i - 49, i + 1).reduce((sum, item) => sum + item.close, 0) / 50
      history[i].ma50 = Math.round(ma50 * 100) / 100
    }
  }

  return history
}

// 각 종목별 미리 생성된 가격 히스토리
export const PRICE_HISTORIES: Record<string, PriceHistoryItem[]> = {
  '005930': generatePriceHistory(71500, 180, 0.015),  // 삼성전자
  '000660': generatePriceHistory(178000, 180, 0.025), // SK하이닉스
  '035720': generatePriceHistory(45200, 180, 0.03),   // 카카오
  '035420': generatePriceHistory(195000, 180, 0.02),  // NAVER
  'AAPL': generatePriceHistory(185.92, 180, 0.015),   // Apple
  'NVDA': generatePriceHistory(547.20, 180, 0.035),   // NVIDIA
  'MSFT': generatePriceHistory(388.47, 180, 0.012),   // Microsoft
  'GOOGL': generatePriceHistory(141.80, 180, 0.018),  // Alphabet
}

/**
 * 특정 종목의 가격 히스토리 가져오기
 */
export function getPriceHistory(symbol: string): PriceHistoryItem[] {
  return PRICE_HISTORIES[symbol] || generatePriceHistory(100, 180, 0.02)
}
