/**
 * 뉴스/공시 스코어링 함수 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  calculateSentimentScore,
  calculateFrequencyScore,
  simpleKeywordSentiment,
  calculateKeywordBasedSentimentScore,
  calculateDisclosureImpactScore,
  calculateRecencyScore,
  calculateNewsScores,
} from './newsScoring.js'
import type { NewsData, DisclosureItem } from '../../types/index.js'

describe('calculateSentimentScore (감성 점수)', () => {
  it('뉴스가 0개면 5점 반환', () => {
    expect(calculateSentimentScore(7, 0)).toBe(5)
  })

  it('sentimentScore가 null이면 5점 반환', () => {
    expect(calculateSentimentScore(null, 10)).toBe(5)
  })

  it('1-10 범위 점수는 반올림하여 반환', () => {
    expect(calculateSentimentScore(8.4, 5)).toBe(8)
    expect(calculateSentimentScore(3.6, 5)).toBe(4)
    expect(calculateSentimentScore(10, 5)).toBe(10)
    expect(calculateSentimentScore(1, 5)).toBe(1)
  })

  it('0-1 범위 점수는 1-10으로 변환', () => {
    expect(calculateSentimentScore(0, 5)).toBe(1)    // 0 * 9 + 1 = 1
    expect(calculateSentimentScore(0.5, 5)).toBe(6)  // 0.5 * 9 + 1 = 5.5 → 6
    expect(calculateSentimentScore(0.9, 5)).toBe(9)  // 0.9 * 9 + 1 = 9.1 → 9
    // Note: 1은 1-10 범위 조건에 먼저 해당되어 1로 반환됨
  })

  it('범위 외 점수는 5점 반환', () => {
    expect(calculateSentimentScore(-5, 5)).toBe(5)
    expect(calculateSentimentScore(15, 5)).toBe(5)
  })
})

describe('calculateFrequencyScore (빈도 점수)', () => {
  it('적정 빈도(일평균 0.5-2)면 8점', () => {
    // 30일 기준 15-60개
    expect(calculateFrequencyScore(20, 10, 30)).toBe(8)  // 1.0/day
    expect(calculateFrequencyScore(45, 15, 30)).toBe(8)  // 2.0/day
  })

  it('약간 낮은 빈도(0.3-0.5)면 7점', () => {
    expect(calculateFrequencyScore(10, 2, 30)).toBe(7)   // 0.4/day
  })

  it('약간 높은 빈도(2-3)면 7점', () => {
    expect(calculateFrequencyScore(60, 15, 30)).toBe(7)  // 2.5/day
  })

  it('낮은 빈도(0.1-0.3)면 6점', () => {
    expect(calculateFrequencyScore(5, 1, 30)).toBe(6)    // 0.2/day
  })

  it('높은 빈도(3-5)면 5점', () => {
    expect(calculateFrequencyScore(100, 20, 30)).toBe(5) // 4.0/day
  })

  it('매우 낮은 빈도(<0.1)면 4점', () => {
    expect(calculateFrequencyScore(1, 1, 30)).toBe(4)    // 0.07/day
  })

  it('높은 빈도(5-10)면 4점', () => {
    expect(calculateFrequencyScore(150, 50, 30)).toBe(4) // 6.67/day
  })

  it('매우 높은 빈도(>10)면 3점', () => {
    expect(calculateFrequencyScore(300, 100, 30)).toBe(3) // 13.3/day
  })
})

describe('simpleKeywordSentiment (키워드 감성 분석)', () => {
  it('긍정 키워드가 많으면 positive', () => {
    expect(simpleKeywordSentiment('삼성전자 급등, 실적개선으로 신고가')).toBe('positive')
    expect(simpleKeywordSentiment('Stock surges on strong earnings beat')).toBe('positive')
  })

  it('부정 키워드가 많으면 negative', () => {
    expect(simpleKeywordSentiment('주가 급락, 실적악화로 신저가')).toBe('negative')
    expect(simpleKeywordSentiment('Stock drops on weak earnings miss')).toBe('negative')
  })

  it('키워드가 없거나 균형이면 neutral', () => {
    expect(simpleKeywordSentiment('삼성전자 주주총회 개최')).toBe('neutral')
    expect(simpleKeywordSentiment('Company announces quarterly results')).toBe('neutral')
  })

  it('동점이면 neutral', () => {
    expect(simpleKeywordSentiment('주가 상승 후 하락 반복')).toBe('neutral')
  })
})

describe('calculateKeywordBasedSentimentScore (키워드 기반 점수)', () => {
  it('빈 배열이면 5점', () => {
    expect(calculateKeywordBasedSentimentScore([])).toBe(5)
  })

  it('긍정 뉴스만 있으면 8점', () => {
    const titles = [
      '삼성전자 급등',
      '실적개선 호재',
      '신고가 경신',
    ]
    expect(calculateKeywordBasedSentimentScore(titles)).toBe(8)
  })

  it('부정 뉴스만 있으면 2점', () => {
    const titles = [
      '주가 급락',
      '실적악화 우려',
      '신저가 기록',
    ]
    expect(calculateKeywordBasedSentimentScore(titles)).toBe(2)
  })

  it('중립 뉴스만 있으면 5점', () => {
    const titles = [
      '주주총회 개최',
      '분기 실적 발표 예정',
      '임원 인사 발표',
    ]
    expect(calculateKeywordBasedSentimentScore(titles)).toBe(5)
  })

  it('혼합된 뉴스는 평균 점수', () => {
    const titles = [
      '삼성전자 급등',  // positive: 8
      '주가 급락',      // negative: 2
    ]
    expect(calculateKeywordBasedSentimentScore(titles)).toBe(5) // (8+2)/2 = 5
  })
})

describe('calculateDisclosureImpactScore (공시 영향 점수)', () => {
  it('공시가 없으면 5점', () => {
    expect(calculateDisclosureImpactScore([])).toBe(5)
  })

  it('긍정적 공시는 높은 점수', () => {
    const disclosures: DisclosureItem[] = [
      { title: '대규모수주 공시', type: '수주공시', filingDate: '2024-01-15' },
    ]
    expect(calculateDisclosureImpactScore(disclosures)).toBeGreaterThanOrEqual(9)
  })

  it('부정적 공시는 낮은 점수', () => {
    const disclosures: DisclosureItem[] = [
      { title: '유상증자 결정', type: '유상증자', filingDate: '2024-01-15' },
    ]
    expect(calculateDisclosureImpactScore(disclosures)).toBeLessThanOrEqual(4)
  })

  it('중립적 공시는 5점', () => {
    const disclosures: DisclosureItem[] = [
      { title: '분기보고서 제출', type: '분기보고서', filingDate: '2024-01-15' },
    ]
    expect(calculateDisclosureImpactScore(disclosures)).toBe(5)
  })

  it('최신 공시에 높은 가중치', () => {
    const disclosures: DisclosureItem[] = [
      { title: '대규모수주', type: '수주공시', filingDate: '2024-01-15' },  // weight: 2
      { title: '유상증자', type: '유상증자', filingDate: '2024-01-10' },    // weight: 1
    ]
    // (9*2 + 3*1) / (2+1) = 21/3 = 7
    const score = calculateDisclosureImpactScore(disclosures)
    expect(score).toBe(7)
  })

  it('여러 공시의 가중 평균', () => {
    const disclosures: DisclosureItem[] = [
      { title: '정기공시', type: '정기공시', filingDate: '2024-01-15' },
      { title: '정기공시', type: '정기공시', filingDate: '2024-01-14' },
      { title: '정기공시', type: '정기공시', filingDate: '2024-01-13' },
    ]
    expect(calculateDisclosureImpactScore(disclosures)).toBe(5)
  })
})

describe('calculateRecencyScore (신선도 점수)', () => {
  const now = new Date()
  const formatDate = (daysAgo: number) => {
    const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    return date.toISOString()
  }

  it('뉴스/공시가 없으면 4점', () => {
    expect(calculateRecencyScore([], [])).toBe(4)
  })

  it('3일 내 뉴스가 3개 이상이면 10점', () => {
    const recentNews = [
      { publishedAt: formatDate(1) },
      { publishedAt: formatDate(2) },
      { publishedAt: formatDate(2) },
    ]
    expect(calculateRecencyScore(recentNews, [])).toBe(10)
  })

  it('3일 내 뉴스가 2개면 9점', () => {
    const recentNews = [
      { publishedAt: formatDate(1) },
      { publishedAt: formatDate(2) },
    ]
    expect(calculateRecencyScore(recentNews, [])).toBe(9)
  })

  it('3일 내 뉴스가 1개면 8점', () => {
    const recentNews = [
      { publishedAt: formatDate(2) },
    ]
    expect(calculateRecencyScore(recentNews, [])).toBe(8)
  })

  it('7일 내 뉴스가 3개 이상이면 7점', () => {
    const recentNews = [
      { publishedAt: formatDate(5) },
      { publishedAt: formatDate(6) },
      { publishedAt: formatDate(6) },
    ]
    expect(calculateRecencyScore(recentNews, [])).toBe(7)
  })

  it('7일 내 뉴스가 1개면 6점', () => {
    const recentNews = [
      { publishedAt: formatDate(5) },
    ]
    expect(calculateRecencyScore(recentNews, [])).toBe(6)
  })

  it('오래된 뉴스만 있으면 낮은 점수', () => {
    const recentNews = [
      { publishedAt: formatDate(30) },
      { publishedAt: formatDate(40) },
    ]
    expect(calculateRecencyScore(recentNews, [])).toBeLessThanOrEqual(5)
  })
})

describe('calculateNewsScores (종합 뉴스 점수)', () => {
  const baseNewsData: NewsData = {
    newsCount: 10,
    disclosureCount: 5,
    sentimentScore: 7,
    recentNews: [],
    recentDisclosures: [],
  }

  it('모든 점수가 정의됨', () => {
    const scores = calculateNewsScores(baseNewsData)
    expect(scores.sentiment).toBeDefined()
    expect(scores.frequency).toBeDefined()
    expect(scores.disclosureImpact).toBeDefined()
    expect(scores.recency).toBeDefined()
    expect(scores.average).toBeDefined()
  })

  it('평균은 1-10 범위', () => {
    const scores = calculateNewsScores(baseNewsData)
    expect(scores.average).toBeGreaterThanOrEqual(1)
    expect(scores.average).toBeLessThanOrEqual(10)
  })

  it('sentimentScore가 null이면 키워드 기반 분석', () => {
    const now = new Date()
    const dataWithTitles: NewsData = {
      ...baseNewsData,
      sentimentScore: null,
      recentNews: [
        { title: '삼성전자 급등 호재', publishedAt: now.toISOString() },
        { title: '실적개선 기대감', publishedAt: now.toISOString() },
      ],
    }
    const scores = calculateNewsScores(dataWithTitles)
    expect(scores.sentiment).toBeGreaterThanOrEqual(7)  // 긍정 키워드로 높은 점수
  })

  it('긍정적인 뉴스 데이터 = 높은 평균', () => {
    const now = new Date()
    const positiveData: NewsData = {
      newsCount: 30,
      disclosureCount: 10,
      sentimentScore: 9,
      recentNews: [
        { title: '호재', publishedAt: now.toISOString() },
        { title: '급등', publishedAt: now.toISOString() },
        { title: '최고', publishedAt: now.toISOString() },
      ],
      recentDisclosures: [
        { title: '대규모수주', type: '수주공시', filingDate: now.toISOString().split('T')[0] },
      ],
    }
    const scores = calculateNewsScores(positiveData)
    expect(scores.average).toBeGreaterThan(7)
  })

  it('부정적인 뉴스 데이터 = 낮은 평균', () => {
    const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
    const negativeData: NewsData = {
      newsCount: 200,
      disclosureCount: 100,
      sentimentScore: 2,
      recentNews: [
        { title: '급락', publishedAt: oldDate },
      ],
      recentDisclosures: [
        { title: '유상증자', type: '유상증자', filingDate: oldDate.split('T')[0] },
      ],
    }
    const scores = calculateNewsScores(negativeData)
    expect(scores.average).toBeLessThan(4)
  })
})

describe('Edge Cases (엣지 케이스)', () => {
  it('빈 뉴스 데이터 처리', () => {
    const emptyData: NewsData = {
      newsCount: 0,
      disclosureCount: 0,
      sentimentScore: null,
      recentNews: [],
      recentDisclosures: [],
    }
    const scores = calculateNewsScores(emptyData)
    expect(scores.sentiment).toBe(5)
    expect(scores.frequency).toBeDefined()
    expect(scores.disclosureImpact).toBe(5)
  })

  it('극단적으로 많은 뉴스', () => {
    expect(calculateFrequencyScore(500, 200, 30)).toBe(3)
  })

  it('알 수 없는 공시 유형', () => {
    const disclosures: DisclosureItem[] = [
      { title: '알 수 없는 공시', type: '미분류', filingDate: '2024-01-15' },
    ]
    expect(calculateDisclosureImpactScore(disclosures)).toBe(5)  // default
  })

  it('공시 제목에서 키워드 매칭', () => {
    const disclosures: DisclosureItem[] = [
      { title: '자사주취득 결정', type: '기타', filingDate: '2024-01-15' },
    ]
    expect(calculateDisclosureImpactScore(disclosures)).toBe(9)  // 자사주취득
  })
})
