/**
 * 수급 스코어링 함수 테스트
 */

import { describe, it, expect } from 'vitest'
import {
  calculateForeignFlowScore,
  calculateInstitutionFlowScore,
  calculateSupplyDemandScores,
} from './supplyDemandScoring.js'
import type { SupplyDemandData } from '../../types/index.js'

describe('calculateForeignFlowScore (외국인 수급 점수)', () => {
  describe('null 처리', () => {
    it('foreignNetBuy가 null이면 5점', () => {
      expect(calculateForeignFlowScore(null, null, null)).toBe(5)
    })
  })

  describe('순매수 금액 기반', () => {
    it('대량 순매수(>100억) = 높은 점수', () => {
      expect(calculateForeignFlowScore(150, null, null)).toBe(7)  // 5 + 2
    })

    it('중간 순매수(>50억) = 중상위 점수', () => {
      expect(calculateForeignFlowScore(70, null, null)).toBe(7)   // 5 + 1.5 → 7
    })

    it('소규모 순매수(>10억) = 중간 점수', () => {
      expect(calculateForeignFlowScore(20, null, null)).toBe(6)   // 5 + 1
    })

    it('미미한 순매수(>0) = 약간 긍정', () => {
      expect(calculateForeignFlowScore(5, null, null)).toBe(6)    // 5 + 0.5 → 6
    })

    it('대량 순매도(<-100억) = 낮은 점수', () => {
      expect(calculateForeignFlowScore(-150, null, null)).toBe(3) // 5 - 2
    })

    it('중간 순매도(<-50억) = 중하위 점수', () => {
      expect(calculateForeignFlowScore(-70, null, null)).toBe(4)  // 5 - 1.5 → 4
    })

    it('소규모 순매도(<-10억) = 약간 부정', () => {
      expect(calculateForeignFlowScore(-20, null, null)).toBe(4)  // 5 - 1
    })

    it('미미한 순매도(<0) = 약간 부정', () => {
      expect(calculateForeignFlowScore(-5, null, null)).toBe(5)   // 5 - 0.5 → 5
    })
  })

  describe('연속 순매수 일수 기반', () => {
    it('10일 이상 연속 순매수 = 추가 +2', () => {
      expect(calculateForeignFlowScore(20, 12, null)).toBe(8)  // 5 + 1 + 2
    })

    it('5일 이상 연속 순매수 = 추가 +1.5', () => {
      expect(calculateForeignFlowScore(20, 7, null)).toBe(8)   // 5 + 1 + 1.5 → 8
    })

    it('3일 이상 연속 순매수 = 추가 +1', () => {
      expect(calculateForeignFlowScore(20, 4, null)).toBe(7)   // 5 + 1 + 1
    })

    it('10일 이상 연속 순매도 = 추가 -2', () => {
      expect(calculateForeignFlowScore(-20, -12, null)).toBe(2) // 5 - 1 - 2
    })

    it('5일 이상 연속 순매도 = 추가 -1.5', () => {
      expect(calculateForeignFlowScore(-20, -7, null)).toBe(3)  // 5 - 1 - 1.5 → 3
    })

    it('3일 이상 연속 순매도 = 추가 -1', () => {
      expect(calculateForeignFlowScore(-20, -4, null)).toBe(3)  // 5 - 1 - 1
    })
  })

  describe('외국인 지분율 기반', () => {
    it('고지분(>=30%) + 순매수 = 추가 +0.5', () => {
      expect(calculateForeignFlowScore(20, null, 35)).toBe(7)  // 5 + 1 + 0.5 → 7
    })

    it('고지분 + 순매도 = 추가 없음', () => {
      expect(calculateForeignFlowScore(-20, null, 35)).toBe(4) // 5 - 1
    })

    it('저지분(<5%) + 순매수 = 추가 +0.5', () => {
      expect(calculateForeignFlowScore(20, null, 3)).toBe(7)   // 5 + 1 + 0.5 → 7
    })

    it('중간 지분 = 추가 없음', () => {
      expect(calculateForeignFlowScore(20, null, 15)).toBe(6)  // 5 + 1
    })
  })

  describe('점수 범위', () => {
    it('최대 점수는 10', () => {
      // 대량 순매수 + 장기 연속 + 고지분
      expect(calculateForeignFlowScore(200, 15, 40)).toBe(10)
    })

    it('최소 점수는 1', () => {
      // 대량 순매도 + 장기 연속 순매도
      expect(calculateForeignFlowScore(-200, -15, null)).toBe(1)
    })
  })
})

describe('calculateInstitutionFlowScore (기관 수급 점수)', () => {
  describe('null 처리', () => {
    it('institutionNetBuy가 null이면 5점', () => {
      expect(calculateInstitutionFlowScore(null, null)).toBe(5)
    })
  })

  describe('순매수 금액 기반', () => {
    it('대량 순매수(>100억) = 높은 점수', () => {
      expect(calculateInstitutionFlowScore(150, null)).toBe(7)  // 5 + 2
    })

    it('중간 순매수(>50억) = 중상위 점수', () => {
      expect(calculateInstitutionFlowScore(70, null)).toBe(7)   // 5 + 1.5 → 7
    })

    it('소규모 순매수(>10억) = 중간 점수', () => {
      expect(calculateInstitutionFlowScore(20, null)).toBe(6)   // 5 + 1
    })

    it('미미한 순매수(>0) = 약간 긍정', () => {
      expect(calculateInstitutionFlowScore(5, null)).toBe(6)    // 5 + 0.5 → 6
    })

    it('대량 순매도(<-100억) = 낮은 점수', () => {
      expect(calculateInstitutionFlowScore(-150, null)).toBe(3) // 5 - 2
    })

    it('중간 순매도(<-50억) = 중하위 점수', () => {
      expect(calculateInstitutionFlowScore(-70, null)).toBe(4)  // 5 - 1.5 → 4
    })

    it('소규모 순매도(<-10억) = 약간 부정', () => {
      expect(calculateInstitutionFlowScore(-20, null)).toBe(4)  // 5 - 1
    })

    it('미미한 순매도(<0) = 약간 부정', () => {
      expect(calculateInstitutionFlowScore(-5, null)).toBe(5)   // 5 - 0.5 → 5
    })
  })

  describe('연속 순매수 일수 기반', () => {
    it('10일 이상 연속 순매수 = 추가 +2', () => {
      expect(calculateInstitutionFlowScore(20, 12)).toBe(8)  // 5 + 1 + 2
    })

    it('5일 이상 연속 순매수 = 추가 +1.5', () => {
      expect(calculateInstitutionFlowScore(20, 7)).toBe(8)   // 5 + 1 + 1.5 → 8
    })

    it('3일 이상 연속 순매수 = 추가 +1', () => {
      expect(calculateInstitutionFlowScore(20, 4)).toBe(7)   // 5 + 1 + 1
    })

    it('10일 이상 연속 순매도 = 추가 -2', () => {
      expect(calculateInstitutionFlowScore(-20, -12)).toBe(2) // 5 - 1 - 2
    })

    it('5일 이상 연속 순매도 = 추가 -1.5', () => {
      expect(calculateInstitutionFlowScore(-20, -7)).toBe(3)  // 5 - 1 - 1.5 → 3
    })

    it('3일 이상 연속 순매도 = 추가 -1', () => {
      expect(calculateInstitutionFlowScore(-20, -4)).toBe(3)  // 5 - 1 - 1
    })
  })

  describe('점수 범위', () => {
    it('최대 점수는 10', () => {
      expect(calculateInstitutionFlowScore(200, 15)).toBe(9)  // 5 + 2 + 2
    })

    it('최소 점수는 1', () => {
      expect(calculateInstitutionFlowScore(-200, -15)).toBe(1)
    })
  })
})

describe('calculateSupplyDemandScores (종합 수급 점수)', () => {
  const baseData: SupplyDemandData = {
    foreignNetBuy: 50,
    foreignNetBuyDays: 5,
    foreignOwnership: 20,
    institutionNetBuy: 30,
    institutionNetBuyDays: 3,
  }

  it('모든 점수가 정의됨', () => {
    const scores = calculateSupplyDemandScores(baseData)
    expect(scores.foreignFlow).toBeDefined()
    expect(scores.institutionFlow).toBeDefined()
    expect(scores.average).toBeDefined()
  })

  it('평균은 두 점수의 평균', () => {
    const data: SupplyDemandData = {
      foreignNetBuy: 150,    // 7점
      foreignNetBuyDays: null,
      foreignOwnership: null,
      institutionNetBuy: 150, // 7점
      institutionNetBuyDays: null,
    }
    const scores = calculateSupplyDemandScores(data)
    expect(scores.foreignFlow).toBe(7)
    expect(scores.institutionFlow).toBe(7)
    expect(scores.average).toBe(7)
  })

  it('긍정적인 수급 = 높은 평균', () => {
    const positiveData: SupplyDemandData = {
      foreignNetBuy: 200,
      foreignNetBuyDays: 15,
      foreignOwnership: 40,
      institutionNetBuy: 200,
      institutionNetBuyDays: 15,
    }
    const scores = calculateSupplyDemandScores(positiveData)
    expect(scores.average).toBeGreaterThan(8)
  })

  it('부정적인 수급 = 낮은 평균', () => {
    const negativeData: SupplyDemandData = {
      foreignNetBuy: -200,
      foreignNetBuyDays: -15,
      foreignOwnership: 10,
      institutionNetBuy: -200,
      institutionNetBuyDays: -15,
    }
    const scores = calculateSupplyDemandScores(negativeData)
    expect(scores.average).toBeLessThan(2)
  })

  it('모두 null이면 5점', () => {
    const nullData: SupplyDemandData = {
      foreignNetBuy: null,
      foreignNetBuyDays: null,
      foreignOwnership: null,
      institutionNetBuy: null,
      institutionNetBuyDays: null,
    }
    const scores = calculateSupplyDemandScores(nullData)
    expect(scores.foreignFlow).toBe(5)
    expect(scores.institutionFlow).toBe(5)
    expect(scores.average).toBe(5)
  })
})

describe('Edge Cases (엣지 케이스)', () => {
  it('0원 순매수/매도는 변화 없음', () => {
    expect(calculateForeignFlowScore(0, null, null)).toBe(5)
    expect(calculateInstitutionFlowScore(0, null)).toBe(5)
  })

  it('극단적인 순매수', () => {
    expect(calculateForeignFlowScore(10000, 30, 60)).toBe(10)
    expect(calculateInstitutionFlowScore(10000, 30)).toBe(9)
  })

  it('극단적인 순매도', () => {
    expect(calculateForeignFlowScore(-10000, -30, 10)).toBe(1)
    expect(calculateInstitutionFlowScore(-10000, -30)).toBe(1)
  })

  it('외국인만 매수, 기관은 매도', () => {
    const mixedData: SupplyDemandData = {
      foreignNetBuy: 200,
      foreignNetBuyDays: 10,
      foreignOwnership: 30,
      institutionNetBuy: -200,
      institutionNetBuyDays: -10,
    }
    const scores = calculateSupplyDemandScores(mixedData)
    expect(scores.foreignFlow).toBe(10)
    expect(scores.institutionFlow).toBe(1)
    expect(scores.average).toBe(5.5)  // (10 + 1) / 2
  })

  it('연속 일수만 있고 금액은 0', () => {
    expect(calculateForeignFlowScore(0, 10, null)).toBe(7)  // 5 + 0 + 2
    expect(calculateInstitutionFlowScore(0, 10)).toBe(7)    // 5 + 0 + 2
  })
})
