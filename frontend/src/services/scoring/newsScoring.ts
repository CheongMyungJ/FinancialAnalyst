/**
 * 뉴스/공시 분석 점수 계산 모듈
 * 감성 분석 점수와 뉴스/공시 빈도를 1-10점으로 환산합니다.
 */

import type { NewsData, NewsScores } from '../../types'

/**
 * 감성 분석 점수 계산
 * AI API에서 받은 감성 점수를 그대로 사용하거나,
 * 뉴스가 없으면 중립(5점)으로 반환
 */
export function calculateSentimentScore(
  sentimentScore: number | null,
  newsCount: number
): number {
  // 뉴스가 없으면 중립
  if (newsCount === 0 || sentimentScore === null) {
    return 5
  }

  // 감성 점수가 이미 1-10 범위라면 그대로 반환
  if (sentimentScore >= 1 && sentimentScore <= 10) {
    return Math.round(sentimentScore)
  }

  // 0-1 범위의 감성 점수를 1-10으로 변환
  if (sentimentScore >= 0 && sentimentScore <= 1) {
    return Math.round(sentimentScore * 9) + 1
  }

  return 5  // 기본값
}

/**
 * 뉴스/공시 빈도 점수 계산
 * 적정 수준의 뉴스/공시가 좋음 (너무 많으면 이슈 발생 가능성)
 *
 * @param newsCount 뉴스 수 (최근 30일)
 * @param disclosureCount 공시 수 (최근 30일)
 * @param period 기간 (일)
 */
export function calculateFrequencyScore(
  newsCount: number,
  disclosureCount: number,
  period: number = 30
): number {
  const totalCount = newsCount + disclosureCount
  const dailyAvg = totalCount / period

  // 적정 수준: 일평균 0.5 ~ 2건
  if (dailyAvg >= 0.5 && dailyAvg <= 2) {
    return 8  // 이상적인 관심도
  }

  // 약간 적음: 일평균 0.3 ~ 0.5건
  if (dailyAvg >= 0.3 && dailyAvg < 0.5) {
    return 7
  }

  // 약간 많음: 일평균 2 ~ 3건
  if (dailyAvg > 2 && dailyAvg <= 3) {
    return 7
  }

  // 적음: 일평균 0.1 ~ 0.3건
  if (dailyAvg >= 0.1 && dailyAvg < 0.3) {
    return 6
  }

  // 많음: 일평균 3 ~ 5건
  if (dailyAvg > 3 && dailyAvg <= 5) {
    return 5
  }

  // 매우 적음: 일평균 0.1건 미만 (관심 부족)
  if (dailyAvg < 0.1) {
    return 4
  }

  // 매우 많음: 일평균 5건 초과 (이슈 발생 가능성)
  if (dailyAvg > 5 && dailyAvg <= 10) {
    return 4
  }

  // 과도하게 많음: 일평균 10건 초과
  if (dailyAvg > 10) {
    return 3
  }

  return 5  // 기본값
}

/**
 * 뉴스 키워드 기반 간단한 감성 분석
 * OpenAI API를 사용하지 않는 경우의 대안
 */
export function simpleKeywordSentiment(title: string): 'positive' | 'negative' | 'neutral' {
  const positiveKeywords = [
    '상승', '급등', '호재', '흑자', '최고', '신고가', '수주', '계약', '성장',
    '실적개선', '매출증가', '영업이익', '배당', '자사주', '인수', 'M&A',
    'surge', 'jump', 'gain', 'profit', 'growth', 'beat', 'upgrade', 'buy',
    'bullish', 'record', 'high', 'strong', 'positive', 'dividend',
  ]

  const negativeKeywords = [
    '하락', '급락', '악재', '적자', '최저', '신저가', '손실', '감소', '부진',
    '실적악화', '매출감소', '영업손실', '소송', '리콜', '분쟁', '횡령',
    'drop', 'fall', 'loss', 'decline', 'miss', 'downgrade', 'sell',
    'bearish', 'low', 'weak', 'negative', 'lawsuit', 'recall', 'fraud',
  ]

  const titleLower = title.toLowerCase()

  const positiveCount = positiveKeywords.filter(kw => titleLower.includes(kw.toLowerCase())).length
  const negativeCount = negativeKeywords.filter(kw => titleLower.includes(kw.toLowerCase())).length

  if (positiveCount > negativeCount) return 'positive'
  if (negativeCount > positiveCount) return 'negative'
  return 'neutral'
}

/**
 * 키워드 기반 감성 점수 계산 (대안)
 */
export function calculateKeywordBasedSentimentScore(newsTitles: string[]): number {
  if (newsTitles.length === 0) return 5

  let totalScore = 0
  for (const title of newsTitles) {
    const sentiment = simpleKeywordSentiment(title)
    switch (sentiment) {
      case 'positive':
        totalScore += 8
        break
      case 'negative':
        totalScore += 2
        break
      default:
        totalScore += 5
    }
  }

  return Math.round(totalScore / newsTitles.length)
}

/**
 * 전체 뉴스/공시 분석 점수 계산
 */
export function calculateNewsScores(data: NewsData): NewsScores {
  // 감성 분석 점수
  // AI 분석 결과가 있으면 사용, 없으면 키워드 기반 분석
  let sentiment: number
  if (data.sentimentScore !== null) {
    sentiment = calculateSentimentScore(data.sentimentScore, data.newsCount)
  } else {
    // 키워드 기반 대안
    const titles = data.recentNews.map(n => n.title)
    sentiment = calculateKeywordBasedSentimentScore(titles)
  }

  // 빈도 점수
  const frequency = calculateFrequencyScore(data.newsCount, data.disclosureCount)

  // 평균 점수
  const average = (sentiment + frequency) / 2

  return {
    sentiment,
    frequency,
    average: Math.round(average * 10) / 10,
  }
}
