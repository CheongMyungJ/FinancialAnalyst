/**
 * 뉴스/공시 분석 점수 계산 모듈 (Backend)
 */

import type { NewsData, NewsScores, DisclosureItem } from '../../types/index.js'

// 공시 유형별 영향도 점수 매핑
const DISCLOSURE_IMPACT: Record<string, number> = {
  // 긍정적 공시 (8-10점)
  '수주공시': 9,
  '대규모수주': 10,
  '자사주취득': 9,
  '자사주매입': 9,
  '배당결정': 8,
  '실적호전': 10,
  '흑자전환': 10,
  '신규사업': 8,
  '특허취득': 8,
  '인수합병': 7,  // 중립적일 수 있음

  // 부정적 공시 (1-4점)
  '유상증자': 3,
  '전환사채발행': 4,
  '신주인수권부사채': 4,
  '감사의견거절': 1,
  '상장폐지': 1,
  '실적악화': 2,
  '적자전환': 2,
  '소송제기': 3,
  '횡령배임': 1,
  '주요주주변동': 4,

  // 중립적 공시 (5-6점)
  '정기공시': 5,
  '분기보고서': 5,
  '반기보고서': 5,
  '사업보고서': 5,
  '주주총회': 5,
  '임원변동': 5,
  '기타': 5,
  'default': 5,
}

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

/**
 * 공시 유형별 영향 점수 계산
 * 최근 공시들의 유형을 분석하여 투자 영향도 점수 산출
 */
export function calculateDisclosureImpactScore(disclosures: DisclosureItem[]): number {
  if (disclosures.length === 0) return 5

  let totalScore = 0
  let weightSum = 0

  // 최근 공시에 더 높은 가중치 부여 (최신순 정렬 가정)
  disclosures.forEach((disclosure, index) => {
    const weight = Math.max(1, disclosures.length - index) // 최신일수록 높은 가중치
    const type = disclosure.type || 'default'

    // 공시 유형에서 키워드 매칭
    let impactScore = DISCLOSURE_IMPACT['default']
    for (const [keyword, score] of Object.entries(DISCLOSURE_IMPACT)) {
      if (type.includes(keyword) || disclosure.title.includes(keyword)) {
        impactScore = score
        break
      }
    }

    totalScore += impactScore * weight
    weightSum += weight
  })

  return Math.round(totalScore / weightSum)
}

/**
 * 뉴스 신선도 점수 계산
 * 최근 뉴스가 많을수록 높은 점수 (관심 종목)
 * 단, 너무 오래된 뉴스만 있으면 낮은 점수
 */
export function calculateRecencyScore(
  recentNews: { publishedAt: string }[],
  recentDisclosures: { filingDate: string }[]
): number {
  if (recentNews.length === 0 && recentDisclosures.length === 0) return 4

  const now = new Date()
  let recentCount = 0  // 3일 이내
  let weekCount = 0    // 7일 이내
  let totalCount = 0

  // 뉴스 신선도 분석
  for (const news of recentNews) {
    const publishedDate = new Date(news.publishedAt)
    const daysDiff = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24)

    totalCount++
    if (daysDiff <= 3) recentCount++
    else if (daysDiff <= 7) weekCount++
  }

  // 공시 신선도 분석
  for (const disclosure of recentDisclosures) {
    const filingDate = new Date(disclosure.filingDate)
    const daysDiff = (now.getTime() - filingDate.getTime()) / (1000 * 60 * 60 * 24)

    totalCount++
    if (daysDiff <= 3) recentCount++
    else if (daysDiff <= 7) weekCount++
  }

  // 점수 산출
  const recentRatio = totalCount > 0 ? (recentCount + weekCount * 0.5) / totalCount : 0

  if (recentCount >= 3) return 10      // 최근 3일 내 뉴스가 3개 이상
  if (recentCount >= 2) return 9       // 최근 3일 내 뉴스가 2개 이상
  if (recentCount >= 1) return 8       // 최근 3일 내 뉴스가 1개 이상
  if (weekCount >= 3) return 7         // 최근 7일 내 뉴스가 3개 이상
  if (weekCount >= 1) return 6         // 최근 7일 내 뉴스가 1개 이상
  if (recentRatio >= 0.3) return 5     // 30% 이상이 최근 뉴스
  if (totalCount > 0) return 4         // 뉴스는 있지만 오래됨
  return 3                              // 뉴스 없음
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
  const disclosureImpact = calculateDisclosureImpactScore(data.recentDisclosures)
  const recency = calculateRecencyScore(data.recentNews, data.recentDisclosures)

  const average = (sentiment + frequency + disclosureImpact + recency) / 4

  return {
    sentiment,
    frequency,
    disclosureImpact,
    recency,
    average: Math.round(average * 10) / 10,
  }
}
