/**
 * 뉴스/공시 분석 점수 계산 모듈 (Backend)
 */

import type { NewsData, NewsScores } from '../../types/index.js'

export function calculateSentimentScore(
  sentimentScore: number | null,
  newsCount: number
): number {
  if (newsCount === 0 || sentimentScore === null) {
    return 5
  }

  if (sentimentScore >= 1 && sentimentScore <= 10) {
    return Math.round(sentimentScore)
  }

  if (sentimentScore >= 0 && sentimentScore <= 1) {
    return Math.round(sentimentScore * 9) + 1
  }

  return 5
}

export function calculateFrequencyScore(
  newsCount: number,
  disclosureCount: number,
  period: number = 30
): number {
  const totalCount = newsCount + disclosureCount
  const dailyAvg = totalCount / period

  if (dailyAvg >= 0.5 && dailyAvg <= 2) return 8
  if (dailyAvg >= 0.3 && dailyAvg < 0.5) return 7
  if (dailyAvg > 2 && dailyAvg <= 3) return 7
  if (dailyAvg >= 0.1 && dailyAvg < 0.3) return 6
  if (dailyAvg > 3 && dailyAvg <= 5) return 5
  if (dailyAvg < 0.1) return 4
  if (dailyAvg > 5 && dailyAvg <= 10) return 4
  if (dailyAvg > 10) return 3

  return 5
}

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

export function calculateNewsScores(data: NewsData): NewsScores {
  let sentiment: number
  if (data.sentimentScore !== null) {
    sentiment = calculateSentimentScore(data.sentimentScore, data.newsCount)
  } else {
    const titles = data.recentNews.map(n => n.title)
    sentiment = calculateKeywordBasedSentimentScore(titles)
  }

  const frequency = calculateFrequencyScore(data.newsCount, data.disclosureCount)
  const average = (sentiment + frequency) / 2

  return {
    sentiment,
    frequency,
    average: Math.round(average * 10) / 10,
  }
}
