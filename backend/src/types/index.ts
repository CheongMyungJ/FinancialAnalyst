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
  average: number
}

export interface TechnicalScores {
  maPosition: number
  rsi: number
  volumeTrend: number
  macd: number
  average: number
}

export interface NewsScores {
  sentiment: number
  frequency: number
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
  }
  technical: {
    maPosition: number
    rsi: number
    volumeTrend: number
    macd: number
  }
  news: {
    sentiment: number
    frequency: number
  }
  category: {
    fundamental: number
    technical: number
    news: number
  }
}

// 기본 가중치
export const DEFAULT_WEIGHTS: WeightConfig = {
  fundamental: { per: 25, pbr: 25, roe: 25, operatingMargin: 25 },
  technical: { maPosition: 25, rsi: 25, volumeTrend: 25, macd: 25 },
  news: { sentiment: 50, frequency: 50 },
  category: { fundamental: 40, technical: 40, news: 20 },
}
