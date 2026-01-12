/**
 * 수급 스코어링 함수 테스트 (Frontend)
 */

import { describe, it, expect } from 'vitest'
import {
  calculateForeignFlowScore,
  calculateInstitutionFlowScore,
  calculateSupplyDemandScores,
} from './supplyDemandScoring'
import type { SupplyDemandData } from '../../types'

describe('calculateForeignFlowScore', () => {
  it('null이면 5점', () => expect(calculateForeignFlowScore(null, null, null)).toBe(5))
  it('대량 순매수 = 높은 점수', () => expect(calculateForeignFlowScore(150, null, null)).toBe(7))
  it('대량 순매도 = 낮은 점수', () => expect(calculateForeignFlowScore(-150, null, null)).toBe(3))
  it('연속 순매수 = 추가 점수', () => expect(calculateForeignFlowScore(20, 12, null)).toBe(8))
  it('연속 순매도 = 감점', () => expect(calculateForeignFlowScore(-20, -12, null)).toBe(2))
  it('고지분 + 순매수 = 보너스', () => expect(calculateForeignFlowScore(20, null, 35)).toBe(7))
  it('최대 10점', () => expect(calculateForeignFlowScore(200, 15, 40)).toBe(10))
  it('최소 1점', () => expect(calculateForeignFlowScore(-200, -15, null)).toBe(1))
})

describe('calculateInstitutionFlowScore', () => {
  it('null이면 5점', () => expect(calculateInstitutionFlowScore(null, null)).toBe(5))
  it('대량 순매수 = 높은 점수', () => expect(calculateInstitutionFlowScore(150, null)).toBe(7))
  it('대량 순매도 = 낮은 점수', () => expect(calculateInstitutionFlowScore(-150, null)).toBe(3))
  it('연속 순매수 = 추가 점수', () => expect(calculateInstitutionFlowScore(20, 12)).toBe(8))
  it('연속 순매도 = 감점', () => expect(calculateInstitutionFlowScore(-20, -12)).toBe(2))
  it('최대 9점', () => expect(calculateInstitutionFlowScore(200, 15)).toBe(9))
  it('최소 1점', () => expect(calculateInstitutionFlowScore(-200, -15)).toBe(1))
})

describe('calculateSupplyDemandScores', () => {
  it('모든 점수 반환', () => {
    const data: SupplyDemandData = {
      foreignNetBuy: 50,
      foreignNetBuyDays: 5,
      foreignOwnership: 20,
      institutionNetBuy: 30,
      institutionNetBuyDays: 3,
    }
    const scores = calculateSupplyDemandScores(data)
    expect(scores.foreignFlow).toBeDefined()
    expect(scores.institutionFlow).toBeDefined()
    expect(scores.average).toBeDefined()
  })

  it('평균 계산', () => {
    const data: SupplyDemandData = {
      foreignNetBuy: 150,
      foreignNetBuyDays: null,
      foreignOwnership: null,
      institutionNetBuy: 150,
      institutionNetBuyDays: null,
    }
    const scores = calculateSupplyDemandScores(data)
    expect(scores.foreignFlow).toBe(7)
    expect(scores.institutionFlow).toBe(7)
    expect(scores.average).toBe(7)
  })

  it('모두 null이면 5점', () => {
    const data: SupplyDemandData = {
      foreignNetBuy: null,
      foreignNetBuyDays: null,
      foreignOwnership: null,
      institutionNetBuy: null,
      institutionNetBuyDays: null,
    }
    const scores = calculateSupplyDemandScores(data)
    expect(scores.average).toBe(5)
  })
})
