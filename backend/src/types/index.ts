// 시장 타입
export type Market = 'KOSPI' | 'KOSDAQ' | 'NYSE' | 'NASDAQ'

// 통화 타입
export type Currency = 'KRW' | 'USD'

// 기본적 분석 데이터
export interface FundamentalData {
  per: number | null
  pbr: number | null
  roe: number | null
  operatingMargin: number | null
  eps: number | null
  marketCap: number | null
  debtRatio: number | null        // 부채비율 (%)
  currentRatio: number | null     // 유동비율 (%)
  epsGrowth: number | null        // EPS 성장률 (%, YoY)
  revenueGrowth: number | null    // 매출 성장률 (%, YoY)
}

// 기술적 분석 데이터
export interface TechnicalData {
  ma20: number | null
  ma50: number | null
  ma120: number | null
  rsi: number | null
  macdLine: number | null
  signalLine: number | null
  histogram: number | null
  volumeAvg20: number | null
  volumeChange: number | null
  // 볼린저 밴드
  bollingerUpper: number | null   // 상단 밴드
  bollingerMiddle: number | null  // 중간 밴드 (20일 SMA)
  bollingerLower: number | null   // 하단 밴드
  bollingerWidth: number | null   // 밴드폭 (%)
  bollingerPercentB: number | null // %B (0-1, 현재가 위치)
  // 스토캐스틱
  stochasticK: number | null      // %K (Fast Stochastic)
  stochasticD: number | null      // %D (Slow Stochastic)
  // ADX (Average Directional Index)
  adx: number | null              // ADX 값 (추세 강도)
  plusDI: number | null           // +DI (상승 방향 지표)
  minusDI: number | null          // -DI (하락 방향 지표)
  // 다이버전스
  rsiDivergence: 'bullish' | 'bearish' | null  // RSI 다이버전스
  macdDivergence: 'bullish' | 'bearish' | null // MACD 다이버전스
}

// 뉴스/공시 데이터
export interface NewsData {
  recentNews: NewsItem[]
  recentDisclosures: DisclosureItem[]
  sentimentScore: number | null
  newsCount: number
  disclosureCount: number
}

// 수급 데이터
export interface SupplyDemandData {
  foreignNetBuy: number | null        // 외국인 순매수 (금액)
  institutionNetBuy: number | null    // 기관 순매수 (금액)
  foreignNetBuyDays: number | null    // 외국인 연속 순매수 일수 (음수면 순매도)
  institutionNetBuyDays: number | null // 기관 연속 순매수 일수
  foreignOwnership: number | null      // 외국인 지분율 (%)
}

export interface NewsItem {
  title: string
  source: string
  url: string
  publishedAt: string
  sentiment?: 'positive' | 'negative' | 'neutral'
}

export interface DisclosureItem {
  title: string
  type: string
  filingDate: string
  url: string
}

// 가격 데이터
export interface PriceData {
  date: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

// 주식 종목 전체 정보
export interface Stock {
  symbol: string
  name: string
  nameEn?: string
  market: Market
  sector: string
  currentPrice: number
  previousClose: number
  change: number
  changePercent: number
  currency: Currency
  lastUpdated: string
  fundamentals: FundamentalData
  technicals: TechnicalData
  newsData: NewsData
  supplyDemand: SupplyDemandData
  scores: StockScores
}

// 점수 타입들
export interface StockScores {
  total: number
  fundamental: FundamentalScores
  technical: TechnicalScores
  news: NewsScores
  supplyDemand: SupplyDemandScores
}

export interface FundamentalScores {
  per: number
  pbr: number
  roe: number
  operatingMargin: number
  debtRatio: number           // 부채비율 점수
  currentRatio: number        // 유동비율 점수
  epsGrowth: number           // EPS 성장률 점수
  revenueGrowth: number       // 매출 성장률 점수
  average: number
}

export interface TechnicalScores {
  maPosition: number
  rsi: number
  volumeTrend: number
  macd: number
  bollingerBand: number       // 볼린저 밴드 점수
  stochastic: number          // 스토캐스틱 점수
  adx: number                 // ADX 점수
  divergence: number          // 다이버전스 점수
  average: number
}

export interface NewsScores {
  sentiment: number
  frequency: number
  disclosureImpact: number    // 공시 유형별 영향 점수
  recency: number             // 뉴스 신선도 점수
  average: number
}

export interface SupplyDemandScores {
  foreignFlow: number         // 외국인 수급 점수
  institutionFlow: number     // 기관 수급 점수
  average: number
}

// 종목 목록 아이템
export interface StockListItem {
  symbol: string
  name: string
  market: Market
  sector: string
}

// API 응답 타입
export interface StocksResponse {
  lastUpdated: string
  isAnalyzing: boolean
  stocks: Stock[]
}

export interface StockDetailResponse {
  stock: Stock
  priceHistory: PriceData[]
}

// 가중치 설정
export interface WeightConfig {
  fundamental: {
    per: number
    pbr: number
    roe: number
    operatingMargin: number
    debtRatio: number
    currentRatio: number
    epsGrowth: number
    revenueGrowth: number
  }
  technical: {
    maPosition: number
    rsi: number
    volumeTrend: number
    macd: number
    bollingerBand: number
    stochastic: number
    adx: number
    divergence: number
  }
  news: {
    sentiment: number
    frequency: number
    disclosureImpact: number
    recency: number
  }
  supplyDemand: {
    foreignFlow: number
    institutionFlow: number
  }
  category: {
    fundamental: number
    technical: number
    news: number
    supplyDemand: number
  }
}

// 기본 가중치
export const DEFAULT_WEIGHTS: WeightConfig = {
  fundamental: { per: 15, pbr: 15, roe: 15, operatingMargin: 15, debtRatio: 10, currentRatio: 10, epsGrowth: 10, revenueGrowth: 10 },
  technical: { maPosition: 15, rsi: 15, volumeTrend: 10, macd: 15, bollingerBand: 15, stochastic: 10, adx: 10, divergence: 10 },
  news: { sentiment: 30, frequency: 30, disclosureImpact: 20, recency: 20 },
  supplyDemand: { foreignFlow: 50, institutionFlow: 50 },
  category: { fundamental: 35, technical: 35, news: 15, supplyDemand: 15 },
}
