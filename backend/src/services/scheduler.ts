/**
 * 스케줄러 서비스 (Backend)
 * 1시간마다 자동으로 전체 종목을 분석합니다.
 */

import cron from 'node-cron'
import { analyzeAllStocks, loadSavedData } from './analyzer.js'

let scheduledTask: cron.ScheduledTask | null = null

/**
 * 스케줄러 시작
 * 매 시간 정각에 분석 실행
 */
export function startScheduler(): void {
  if (scheduledTask) {
    console.log('[스케줄러] 이미 실행 중입니다.')
    return
  }

  // 매 시간 정각에 실행 (0 * * * *)
  scheduledTask = cron.schedule('0 * * * *', async () => {
    console.log('[스케줄러] 정기 분석 시작...')
    try {
      await analyzeAllStocks()
      console.log('[스케줄러] 정기 분석 완료.')
    } catch (error) {
      console.error('[스케줄러] 분석 중 오류 발생:', error)
    }
  })

  console.log('[스케줄러] 시작됨 - 매 시간 정각에 분석 실행')
}

/**
 * 스케줄러 중지
 */
export function stopScheduler(): void {
  if (scheduledTask) {
    scheduledTask.stop()
    scheduledTask = null
    console.log('[스케줄러] 중지됨')
  }
}

/**
 * 서버 시작 시 초기화
 * - 저장된 데이터 로드 (캐시가 있으면 즉시 사용 가능)
 * - 데이터가 없거나 오래된 경우 백그라운드에서 분석 시작
 */
export async function initializeAnalysis(): Promise<void> {
  console.log('[초기화] 저장된 데이터 확인 중...')

  const savedData = loadSavedData()

  if (!savedData) {
    console.log('[초기화] 저장된 데이터 없음 - 백그라운드에서 분석 시작')
    // 백그라운드에서 분석 (await 없음 - 비동기)
    analyzeAllStocks().catch(err => {
      console.error('[초기화] 분석 중 오류:', err)
    })
    return
  }

  // 데이터가 6시간 이상 오래된 경우 백그라운드에서 재분석
  const lastUpdated = new Date(savedData.lastUpdated)
  const now = new Date()
  const hoursSinceUpdate = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60)

  console.log(`[초기화] 캐시 데이터 로드 완료 (${savedData.stocks.length}개 종목, ${hoursSinceUpdate.toFixed(1)}시간 전)`)

  if (hoursSinceUpdate > 6) {
    console.log(`[초기화] 데이터가 오래됨 - 백그라운드에서 분석 시작`)
    // 백그라운드에서 분석 (await 없음 - 비동기)
    analyzeAllStocks().catch(err => {
      console.error('[초기화] 분석 중 오류:', err)
    })
  }
}
