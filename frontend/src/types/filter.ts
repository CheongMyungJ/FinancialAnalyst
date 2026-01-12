import type { Market } from './stock'

// 필터 상태
export interface FilterState {
  // 선택된 시장
  markets: Market[]

  // 선택된 섹터
  sectors: string[]

  // 표시할 종목 수
  displayCount: DisplayCount

  // 정렬 기준
  sortBy: SortBy

  // 정렬 순서
  sortOrder: SortOrder

  // 검색어
  searchQuery: string
}

// 표시 개수 옵션
export type DisplayCount = 10 | 20 | 50 | 100

// 정렬 기준
export type SortBy =
  | 'total'           // 종합 점수
  | 'fundamental'     // 기본적 분석 점수
  | 'technical'       // 기술적 분석 점수
  | 'news'            // 뉴스 분석 점수
  | 'name'            // 종목명
  | 'changePercent'   // 등락률

// 정렬 순서
export type SortOrder = 'asc' | 'desc'

// 기본 필터 상태
export const DEFAULT_FILTER: FilterState = {
  markets: ['KOSPI', 'KOSDAQ', 'NYSE', 'NASDAQ'],
  sectors: [],
  displayCount: 20,
  sortBy: 'total',
  sortOrder: 'desc',
  searchQuery: '',
}

// 섹터 목록 (한국)
export const SECTORS_KR = [
  '전기전자',
  '의약품',
  '화학',
  '철강금속',
  '기계',
  '건설업',
  '운수장비',
  '유통업',
  '전기가스업',
  '서비스업',
  '통신업',
  '은행',
  '증권',
  '보험',
  '음식료품',
  '섬유의복',
  '종이목재',
  '비금속광물',
  '의료정밀',
  '운수창고업',
]

// 섹터 목록 (미국)
export const SECTORS_US = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Consumer Cyclical',
  'Consumer Defensive',
  'Energy',
  'Industrials',
  'Basic Materials',
  'Communication Services',
  'Utilities',
  'Real Estate',
]
