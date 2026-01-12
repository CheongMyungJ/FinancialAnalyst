/**
 * 수급 분석 점수 계산 모듈 (Backend)
 * 외국인/기관 투자자의 매매 동향을 분석하여 점수화
 */

import type { SupplyDemandData, SupplyDemandScores } from '../../types/index.js'

/**
 * 외국인 수급 점수 계산
 * 외국인 순매수가 지속되면 긍정적 신호
 */
export function calculateForeignFlowScore(
  foreignNetBuy: number | null,
  foreignNetBuyDays: number | null,
  foreignOwnership: number | null
): number {
  if (foreignNetBuy === null) return 5

  let score = 5

  // 순매수/순매도 금액 기반 점수
  // 금액 단위: 억원 (한국) 또는 백만달러 (미국)
  if (foreignNetBuy > 100) {
    score += 2  // 대량 순매수
  } else if (foreignNetBuy > 50) {
    score += 1.5
  } else if (foreignNetBuy > 10) {
    score += 1
  } else if (foreignNetBuy > 0) {
    score += 0.5
  } else if (foreignNetBuy < -100) {
    score -= 2  // 대량 순매도
  } else if (foreignNetBuy < -50) {
    score -= 1.5
  } else if (foreignNetBuy < -10) {
    score -= 1
  } else if (foreignNetBuy < 0) {
    score -= 0.5
  }

  // 연속 순매수/순매도 일수 기반 점수
  if (foreignNetBuyDays !== null) {
    if (foreignNetBuyDays >= 10) {
      score += 2  // 10일 이상 연속 순매수
    } else if (foreignNetBuyDays >= 5) {
      score += 1.5
    } else if (foreignNetBuyDays >= 3) {
      score += 1
    } else if (foreignNetBuyDays <= -10) {
      score -= 2  // 10일 이상 연속 순매도
    } else if (foreignNetBuyDays <= -5) {
      score -= 1.5
    } else if (foreignNetBuyDays <= -3) {
      score -= 1
    }
  }

  // 외국인 지분율 기반 추가 점수
  if (foreignOwnership !== null) {
    if (foreignOwnership >= 30) {
      // 높은 외국인 지분율 - 관심 종목
      if (foreignNetBuy > 0) {
        score += 0.5  // 추가 매수는 더 긍정적
      }
    } else if (foreignOwnership < 5) {
      // 낮은 외국인 지분율 - 신규 유입 가능성
      if (foreignNetBuy > 0) {
        score += 0.5  // 신규 관심은 긍정적
      }
    }
  }

  return Math.min(10, Math.max(1, Math.round(score)))
}

/**
 * 기관 수급 점수 계산
 * 기관 순매수가 지속되면 긍정적 신호
 */
export function calculateInstitutionFlowScore(
  institutionNetBuy: number | null,
  institutionNetBuyDays: number | null
): number {
  if (institutionNetBuy === null) return 5

  let score = 5

  // 순매수/순매도 금액 기반 점수
  if (institutionNetBuy > 100) {
    score += 2
  } else if (institutionNetBuy > 50) {
    score += 1.5
  } else if (institutionNetBuy > 10) {
    score += 1
  } else if (institutionNetBuy > 0) {
    score += 0.5
  } else if (institutionNetBuy < -100) {
    score -= 2
  } else if (institutionNetBuy < -50) {
    score -= 1.5
  } else if (institutionNetBuy < -10) {
    score -= 1
  } else if (institutionNetBuy < 0) {
    score -= 0.5
  }

  // 연속 순매수/순매도 일수 기반 점수
  if (institutionNetBuyDays !== null) {
    if (institutionNetBuyDays >= 10) {
      score += 2
    } else if (institutionNetBuyDays >= 5) {
      score += 1.5
    } else if (institutionNetBuyDays >= 3) {
      score += 1
    } else if (institutionNetBuyDays <= -10) {
      score -= 2
    } else if (institutionNetBuyDays <= -5) {
      score -= 1.5
    } else if (institutionNetBuyDays <= -3) {
      score -= 1
    }
  }

  return Math.min(10, Math.max(1, Math.round(score)))
}

/**
 * 전체 수급 분석 점수 계산
 */
export function calculateSupplyDemandScores(
  data: SupplyDemandData
): SupplyDemandScores {
  const foreignFlow = calculateForeignFlowScore(
    data.foreignNetBuy,
    data.foreignNetBuyDays,
    data.foreignOwnership
  )
  const institutionFlow = calculateInstitutionFlowScore(
    data.institutionNetBuy,
    data.institutionNetBuyDays
  )

  const average = (foreignFlow + institutionFlow) / 2

  return {
    foreignFlow,
    institutionFlow,
    average: Math.round(average * 10) / 10,
  }
}
