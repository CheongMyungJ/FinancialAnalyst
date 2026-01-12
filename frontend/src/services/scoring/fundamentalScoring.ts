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

/**
 * EPS 성장률 점수 계산
 * EPS 성장률 = (금기 EPS - 전기 EPS) / |전기 EPS| × 100
 * 성장률이 높을수록 좋지만, 안정적인 성장이 더 가치 있음
 */
export function calculateEPSGrowthScore(epsGrowth: number | null): number {
  if (epsGrowth === null) return 5

  // 성장률이 높을수록 좋음
  if (epsGrowth >= 50) return 10   // 고성장
  if (epsGrowth >= 30) return 9    // 높은 성장
  if (epsGrowth >= 20) return 8    // 양호한 성장
  if (epsGrowth >= 15) return 7    // 안정적 성장
  if (epsGrowth >= 10) return 6    // 평균 성장
  if (epsGrowth >= 5) return 5     // 소폭 성장
  if (epsGrowth >= 0) return 4     // 성장 정체
  if (epsGrowth >= -10) return 3   // 소폭 감소
  if (epsGrowth >= -20) return 2   // 감소
  return 1                          // 큰 폭 감소
}

/**
 * 매출 성장률 점수 계산
 * 매출 성장률 = (금기 매출 - 전기 매출) / 전기 매출 × 100
 * 지속적인 매출 성장은 기업 가치 증가의 기반
 */
export function calculateRevenueGrowthScore(revenueGrowth: number | null): number {
  if (revenueGrowth === null) return 5

  // 매출 성장률이 높을수록 좋음
  if (revenueGrowth >= 40) return 10  // 고성장
  if (revenueGrowth >= 25) return 9   // 높은 성장
  if (revenueGrowth >= 15) return 8   // 양호한 성장
  if (revenueGrowth >= 10) return 7   // 안정적 성장
  if (revenueGrowth >= 5) return 6    // 평균 성장
  if (revenueGrowth >= 0) return 5    // 성장 정체
  if (revenueGrowth >= -5) return 4   // 소폭 감소
  if (revenueGrowth >= -10) return 3  // 감소
  if (revenueGrowth >= -20) return 2  // 큰 폭 감소
  return 1                             // 급감
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
  const debtRatio = calculateDebtRatioScore(data.debtRatio)
  const currentRatio = calculateCurrentRatioScore(data.currentRatio)
  const epsGrowth = calculateEPSGrowthScore(data.epsGrowth)
  const revenueGrowth = calculateRevenueGrowthScore(data.revenueGrowth)

  const average = (per + pbr + roe + operatingMargin + debtRatio + currentRatio + epsGrowth + revenueGrowth) / 8

  return {
    per,
    pbr,
    roe,
    operatingMargin,
    debtRatio,
    currentRatio,
    epsGrowth,
    revenueGrowth,
    average: Math.round(average * 10) / 10,
  }
}
