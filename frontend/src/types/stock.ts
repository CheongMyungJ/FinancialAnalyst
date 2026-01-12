// 시장 타입
export type Market = 'KOSPI' | 'KOSDAQ' | 'NYSE' | 'NASDAQ'

// 통화 타입
export type Currency = 'KRW' | 'USD'

// 기본적 분석 데이터
export interface FundamentalData {
  per: number | null        // 주가수익비율
  pbr: number | null        // 주가순자산비율
  roe: number | null        // 자기자본이익률 (%)
  operatingMargin: number | null  // 영업이익률 (%)
  eps: number | null        // 주당순이익
  marketCap: number | null  // 시가총액
}

// 기술적 분석 데이터
export interface TechnicalData {
  ma20: number | null       // 20일 이동평균
  ma50: number | null       // 50일 이동평균
  ma120: number | null      // 120일 이동평균
  rsi: number | null        // RSI (14일)
  macdLine: number | null   // MACD 라인
  signalLine: number | null // 시그널 라인
  histogram: number | null  // MACD 히스토그램
  volumeAvg20: number | null // 20일 평균 거래량
  volumeChange: number | null // 거래량 변화율
}

// 뉴스/공시 데이터
export interface NewsData {
  recentNews: NewsItem[]
  recentDisclosures: DisclosureItem[]
  sentimentScore: number | null  // AI 분석 감성 점수 (1-10)
  newsCount: number              // 최근 30일 뉴스 수
  disclosureCount: number        // 최근 30일 공시 수
}

// 뉴스 아이템
export interface NewsItem {
  title: string
  source: string
  url: string
  publishedAt: string
  sentiment?: 'positive' | 'negative' | 'neutral'
}

// 공시 아이템
export interface DisclosureItem {
  title: string
  type: string
  filingDate: string
  url: string
}

// 가격 데이터 (차트용)
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
  symbol: string          // 종목 코드
  name: string            // 종목명
  nameEn?: string         // 영문명
  market: Market          // 시장
  sector: string          // 섹터/업종
  currentPrice: number    // 현재가
  previousClose: number   // 전일 종가
  change: number          // 변동액
  changePercent: number   // 변동률 (%)
  currency: Currency      // 통화
  lastUpdated: string     // 마지막 업데이트 시간

  // 상세 데이터
  fundamentals: FundamentalData
  technicals: TechnicalData
  newsData: NewsData

  // 점수
  scores: StockScores
}

// 주식 점수
export interface StockScores {
  total: number           // 종합 점수 (1-10)
  fundamental: FundamentalScores
  technical: TechnicalScores
  news: NewsScores
}

// 기본적 분석 점수
export interface FundamentalScores {
  per: number             // PER 점수 (1-10)
  pbr: number             // PBR 점수 (1-10)
  roe: number             // ROE 점수 (1-10)
  operatingMargin: number // 영업이익률 점수 (1-10)
  average: number         // 평균 점수
}

// 기술적 분석 점수
export interface TechnicalScores {
  maPosition: number      // 이동평균선 위치 점수 (1-10)
  rsi: number             // RSI 점수 (1-10)
  volumeTrend: number     // 거래량 추세 점수 (1-10)
  macd: number            // MACD 점수 (1-10)
  average: number         // 평균 점수
}

// 뉴스 분석 점수
export interface NewsScores {
  sentiment: number       // 감성 분석 점수 (1-10)
  frequency: number       // 뉴스/공시 빈도 점수 (1-10)
  average: number         // 평균 점수
}

// 종목 목록 아이템 (간소화된 버전)
export interface StockListItem {
  symbol: string
  name: string
  market: Market
  sector: string
}
