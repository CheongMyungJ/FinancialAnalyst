/**
 * 기본적 분석 점수 계산 모듈 (Backend)
 */

import type { FundamentalData, FundamentalScores } from '../../types/index.js'

const INDUSTRY_AVG_PER: Record<string, number> = {
  'Technology': 25,
  'Healthcare': 20,
  'Financial Services': 12,
  'Consumer Cyclical': 18,
  'Consumer Defensive': 20,
  'Energy': 10,
  'Industrials': 16,
  'Basic Materials': 12,
  'Communication Services': 18,
  'Utilities': 15,
  'Real Estate': 30,
  '전기전자': 15,
  '의약품': 25,
  '화학': 12,
  '철강금속': 8,
  '기계': 12,
  '건설업': 10,
  '운수장비': 10,
  '유통업': 15,
  '서비스업': 18,
  '통신업': 12,
  '은행': 8,
  '증권': 12,
  '보험': 10,
  'default': 15,
}

const INDUSTRY_AVG_MARGIN: Record<string, number> = {
  'Technology': 20,
  'Healthcare': 15,
  'Financial Services': 25,
  'Consumer Cyclical': 8,
  'Consumer Defensive': 10,
  'Energy': 12,
  'Industrials': 10,
  'Basic Materials': 10,
  'Communication Services': 18,
  'Utilities': 15,
  'Real Estate': 30,
  '전기전자': 12,
  '의약품': 15,
  '화학': 10,
  '철강금속': 8,
  '기계': 8,
  '건설업': 6,
  '운수장비': 5,
  '유통업': 5,
  '서비스업': 12,
  '통신업': 15,
  '은행': 20,
  '증권': 25,
  '보험': 15,
  'default': 10,
}

export function calculatePERScore(per: number | null, sector?: string): number {
  if (per === null || per <= 0) return 1

  const industryAvg = INDUSTRY_AVG_PER[sector || 'default'] || INDUSTRY_AVG_PER['default']
  const ratio = per / industryAvg

  if (ratio < 0.5) return 10
  if (ratio < 0.7) return 9
  if (ratio < 0.85) return 8
  if (ratio < 1.0) return 7
  if (ratio < 1.15) return 6
  if (ratio < 1.3) return 5
  if (ratio < 1.5) return 4
  if (ratio < 2.0) return 3
  if (ratio < 3.0) return 2
  return 1
}

export function calculatePBRScore(pbr: number | null): number {
  if (pbr === null || pbr <= 0) return 1

  if (pbr < 0.5) return 10
  if (pbr < 0.7) return 9
  if (pbr < 1.0) return 8
  if (pbr < 1.5) return 7
  if (pbr < 2.0) return 6
  if (pbr < 2.5) return 5
  if (pbr < 3.0) return 4
  if (pbr < 4.0) return 3
  if (pbr < 5.0) return 2
  return 1
}

export function calculateROEScore(roe: number | null): number {
  if (roe === null) return 5
  if (roe < 0) return 1

  if (roe >= 30) return 10
  if (roe >= 25) return 9
  if (roe >= 20) return 8
  if (roe >= 15) return 7
  if (roe >= 12) return 6
  if (roe >= 10) return 5
  if (roe >= 7) return 4
  if (roe >= 5) return 3
  if (roe >= 3) return 2
  return 1
}

export function calculateOperatingMarginScore(
  margin: number | null,
  sector?: string
): number {
  if (margin === null) return 5
  if (margin < 0) return 1

  const industryAvg = INDUSTRY_AVG_MARGIN[sector || 'default'] || INDUSTRY_AVG_MARGIN['default']
  const ratio = margin / industryAvg

  if (ratio >= 2.0) return 10
  if (ratio >= 1.5) return 9
  if (ratio >= 1.3) return 8
  if (ratio >= 1.15) return 7
  if (ratio >= 1.0) return 6
  if (ratio >= 0.85) return 5
  if (ratio >= 0.7) return 4
  if (ratio >= 0.5) return 3
  if (ratio >= 0.3) return 2
  return 1
}

/**
 * 부채비율 점수 계산
 * 부채비율 = (총부채 / 자기자본) × 100
 * 낮을수록 재무 안정성이 높음
 */
export function calculateDebtRatioScore(debtRatio: number | null): number {
  if (debtRatio === null) return 5

  // 부채비율이 낮을수록 좋음
  if (debtRatio <= 30) return 10   // 매우 우수 (무차입 경영)
  if (debtRatio <= 50) return 9    // 우수
  if (debtRatio <= 80) return 8    // 양호
  if (debtRatio <= 100) return 7   // 적정 (자기자본 = 부채)
  if (debtRatio <= 150) return 6   // 보통
  if (debtRatio <= 200) return 5   // 주의
  if (debtRatio <= 300) return 4   // 경고
  if (debtRatio <= 400) return 3   // 위험
  if (debtRatio <= 500) return 2   // 고위험
  return 1                          // 매우 고위험
}

/**
 * 유동비율 점수 계산
 * 유동비율 = (유동자산 / 유동부채) × 100
 * 100% 이상이면 단기 지급 능력 양호
 */
export function calculateCurrentRatioScore(currentRatio: number | null): number {
  if (currentRatio === null) return 5

  // 유동비율이 높을수록 좋음 (단, 너무 높으면 자산 효율성 문제)
  if (currentRatio >= 300) return 8  // 매우 높음 (과잉 유동성)
  if (currentRatio >= 200) return 10 // 매우 우수
  if (currentRatio >= 150) return 9  // 우수
  if (currentRatio >= 120) return 8  // 양호
  if (currentRatio >= 100) return 7  // 적정
  if (currentRatio >= 80) return 5   // 주의
  if (currentRatio >= 60) return 4   // 경고
  if (currentRatio >= 40) return 3   // 위험
  if (currentRatio >= 20) return 2   // 고위험
  return 1                            // 매우 고위험
}

export function calculateFundamentalScores(
  data: FundamentalData,
  sector?: string
): FundamentalScores {
  const per = calculatePERScore(data.per, sector)
  const pbr = calculatePBRScore(data.pbr)
  const roe = calculateROEScore(data.roe)
  const operatingMargin = calculateOperatingMarginScore(data.operatingMargin, sector)
  const debtRatio = calculateDebtRatioScore(data.debtRatio)
  const currentRatio = calculateCurrentRatioScore(data.currentRatio)

  const average = (per + pbr + roe + operatingMargin + debtRatio + currentRatio) / 6

  return {
    per,
    pbr,
    roe,
    operatingMargin,
    debtRatio,
    currentRatio,
    average: Math.round(average * 10) / 10,
  }
}
