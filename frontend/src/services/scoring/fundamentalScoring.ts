/**
 * 기본적 분석 점수 계산 모듈
 * PER, PBR, ROE, 영업이익률 등의 재무 지표를 1-10점으로 환산합니다.
 */

import type { FundamentalData, FundamentalScores } from '../../types'

// 업종별 평균 PER (대략적인 값)
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

// 업종별 평균 영업이익률
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

/**
 * PER 점수 계산 (낮을수록 저평가 = 고점수)
 */
export function calculatePERScore(per: number | null, sector?: string): number {
  if (per === null || per <= 0) return 1  // 적자 또는 데이터 없음

  const industryAvg = INDUSTRY_AVG_PER[sector || 'default'] || INDUSTRY_AVG_PER['default']
  const ratio = per / industryAvg

  if (ratio < 0.5) return 10   // 매우 저평가
  if (ratio < 0.7) return 9
  if (ratio < 0.85) return 8
  if (ratio < 1.0) return 7    // 업종 평균 이하
  if (ratio < 1.15) return 6
  if (ratio < 1.3) return 5    // 업종 평균 수준
  if (ratio < 1.5) return 4
  if (ratio < 2.0) return 3
  if (ratio < 3.0) return 2
  return 1                      // 매우 고평가
}

/**
 * PBR 점수 계산 (낮을수록 저평가 = 고점수)
 */
export function calculatePBRScore(pbr: number | null): number {
  if (pbr === null || pbr <= 0) return 1

  if (pbr < 0.5) return 10     // 순자산 대비 절반 이하
  if (pbr < 0.7) return 9
  if (pbr < 1.0) return 8      // 순자산 이하 (저평가)
  if (pbr < 1.5) return 7
  if (pbr < 2.0) return 6      // 적정 수준
  if (pbr < 2.5) return 5
  if (pbr < 3.0) return 4
  if (pbr < 4.0) return 3
  if (pbr < 5.0) return 2
  return 1                      // 고평가
}

/**
 * ROE 점수 계산 (높을수록 좋음 = 고점수)
 */
export function calculateROEScore(roe: number | null): number {
  if (roe === null) return 5   // 데이터 없음 = 중립
  if (roe < 0) return 1        // 적자

  if (roe >= 30) return 10     // 매우 우수
  if (roe >= 25) return 9
  if (roe >= 20) return 8      // 우수
  if (roe >= 15) return 7
  if (roe >= 12) return 6      // 양호
  if (roe >= 10) return 5
  if (roe >= 7) return 4       // 보통
  if (roe >= 5) return 3
  if (roe >= 3) return 2
  return 1                      // 저조
}

/**
 * 영업이익률 점수 계산
 */
export function calculateOperatingMarginScore(
  margin: number | null,
  sector?: string
): number {
  if (margin === null) return 5  // 데이터 없음 = 중립
  if (margin < 0) return 1       // 영업손실

  const industryAvg = INDUSTRY_AVG_MARGIN[sector || 'default'] || INDUSTRY_AVG_MARGIN['default']
  const ratio = margin / industryAvg

  if (ratio >= 2.0) return 10    // 업종 평균의 2배 이상
  if (ratio >= 1.5) return 9
  if (ratio >= 1.3) return 8
  if (ratio >= 1.15) return 7
  if (ratio >= 1.0) return 6     // 업종 평균 수준
  if (ratio >= 0.85) return 5
  if (ratio >= 0.7) return 4
  if (ratio >= 0.5) return 3
  if (ratio >= 0.3) return 2
  return 1                        // 업종 평균의 30% 미만
}

/**
 * 전체 기본적 분석 점수 계산
 */
export function calculateFundamentalScores(
  data: FundamentalData,
  sector?: string
): FundamentalScores {
  const per = calculatePERScore(data.per, sector)
  const pbr = calculatePBRScore(data.pbr)
  const roe = calculateROEScore(data.roe)
  const operatingMargin = calculateOperatingMarginScore(data.operatingMargin, sector)

  const average = (per + pbr + roe + operatingMargin) / 4

  return {
    per,
    pbr,
    roe,
    operatingMargin,
    average: Math.round(average * 10) / 10,
  }
}
