/**
 * 뉴스/공시 스코어링 함수 테스트 (Frontend)
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
} from './newsScoring'
import type { NewsData, DisclosureItem } from '../../types'

describe('calculateSentimentScore', () => {
  it('뉴스 0개면 5점', () => expect(calculateSentimentScore(7, 0)).toBe(5))
  it('null이면 5점', () => expect(calculateSentimentScore(null, 10)).toBe(5))
  it('1-10 범위는 반올림', () => {
    expect(calculateSentimentScore(8.4, 5)).toBe(8)
    expect(calculateSentimentScore(3.6, 5)).toBe(4)
  })
  it('0-1 범위는 변환', () => {
    expect(calculateSentimentScore(0, 5)).toBe(1)
    expect(calculateSentimentScore(0.5, 5)).toBe(6)
  })
})

describe('calculateFrequencyScore', () => {
  it('적정 빈도 = 8점', () => expect(calculateFrequencyScore(20, 10, 30)).toBe(8))
  it('낮은 빈도 = 낮은 점수', () => expect(calculateFrequencyScore(1, 1, 30)).toBe(4))
  it('과도한 빈도 = 낮은 점수', () => expect(calculateFrequencyScore(300, 100, 30)).toBe(3))
})

describe('simpleKeywordSentiment', () => {
  it('긍정 키워드 = positive', () => {
    expect(simpleKeywordSentiment('삼성전자 급등 호재')).toBe('positive')
  })
  it('부정 키워드 = negative', () => {
    expect(simpleKeywordSentiment('주가 급락 악재')).toBe('negative')
  })
  it('중립 = neutral', () => {
    expect(simpleKeywordSentiment('주주총회 개최')).toBe('neutral')
  })
})

describe('calculateKeywordBasedSentimentScore', () => {
  it('빈 배열 = 5점', () => expect(calculateKeywordBasedSentimentScore([])).toBe(5))
  it('긍정 뉴스 = 8점', () => {
    expect(calculateKeywordBasedSentimentScore(['급등', '호재', '신고가'])).toBe(8)
  })
  it('부정 뉴스 = 2점', () => {
    expect(calculateKeywordBasedSentimentScore(['급락', '악재', '신저가'])).toBe(2)
  })
})

describe('calculateDisclosureImpactScore', () => {
  it('공시 없으면 5점', () => expect(calculateDisclosureImpactScore([])).toBe(5))
  it('긍정 공시 = 높은 점수', () => {
    const disclosures: DisclosureItem[] = [
      { title: '대규모수주', type: '수주공시', filingDate: '2024-01-15' },
    ]
    expect(calculateDisclosureImpactScore(disclosures)).toBeGreaterThanOrEqual(9)
  })
  it('부정 공시 = 낮은 점수', () => {
    const disclosures: DisclosureItem[] = [
      { title: '유상증자', type: '유상증자', filingDate: '2024-01-15' },
    ]
    expect(calculateDisclosureImpactScore(disclosures)).toBeLessThanOrEqual(4)
  })
})

describe('calculateRecencyScore', () => {
  const now = new Date()
  const formatDate = (daysAgo: number) => {
    return new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString()
  }

  it('뉴스 없으면 4점', () => expect(calculateRecencyScore([], [])).toBe(4))
  it('3일 내 3개 = 10점', () => {
    const news = [
      { publishedAt: formatDate(1) },
      { publishedAt: formatDate(2) },
      { publishedAt: formatDate(2) },
    ]
    expect(calculateRecencyScore(news, [])).toBe(10)
  })
})

describe('calculateNewsScores', () => {
  const baseData: NewsData = {
    newsCount: 10,
    disclosureCount: 5,
    sentimentScore: 7,
    recentNews: [],
    recentDisclosures: [],
  }

  it('모든 점수 반환', () => {
    const scores = calculateNewsScores(baseData)
    expect(scores.sentiment).toBeDefined()
    expect(scores.frequency).toBeDefined()
    expect(scores.disclosureImpact).toBeDefined()
    expect(scores.recency).toBeDefined()
    expect(scores.average).toBeDefined()
  })

  it('평균은 1-10 범위', () => {
    const scores = calculateNewsScores(baseData)
    expect(scores.average).toBeGreaterThanOrEqual(1)
    expect(scores.average).toBeLessThanOrEqual(10)
  })
})
