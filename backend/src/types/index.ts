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
}

// 뉴스/공시 데이터
export interface NewsData {
  recentNews: NewsItem[]
  recentDisclosures: DisclosureItem[]
  sentimentScore: number | null
  newsCount: number
  disclosureCount: number
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
  scores: StockScores
}

// 점수 타입들
export interface StockScores {
  total: number
  fundamental: FundamentalScores
  technical: TechnicalScores
  news: NewsScores
}

export interface FundamentalScores {
  per: number
  pbr: number
  roe: number
  operatingMargin: number
  debtRatio: number           // 부채비율 점수
  currentRatio: number        // 유동비율 점수
  average: number
}

export interface TechnicalScores {
  maPosition: number
  rsi: number
  volumeTrend: number
  macd: number
  bollingerBand: number       // 볼린저 밴드 점수
  average: number
}

export interface NewsScores {
  sentiment: number
  frequency: number
  disclosureImpact: number    // 공시 유형별 영향 점수
  recency: number             // 뉴스 신선도 점수
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
  }
  technical: {
    maPosition: number
    rsi: number
    volumeTrend: number
    macd: number
    bollingerBand: number
  }
  news: {
    sentiment: number
    frequency: number
    disclosureImpact: number
    recency: number
  }
  category: {
    fundamental: number
    technical: number
    news: number
  }
}

// 기본 가중치
export const DEFAULT_WEIGHTS: WeightConfig = {
  fundamental: { per: 20, pbr: 20, roe: 20, operatingMargin: 20, debtRatio: 10, currentRatio: 10 },
  technical: { maPosition: 20, rsi: 20, volumeTrend: 20, macd: 20, bollingerBand: 20 },
  news: { sentiment: 30, frequency: 30, disclosureImpact: 20, recency: 20 },
  category: { fundamental: 40, technical: 40, news: 20 },
}
