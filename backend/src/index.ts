/**
 * Trading Analysis Backend Server
 * 주식 분석 백엔드 서버
 */

import express from 'express'
import cors from 'cors'
import stocksRouter from './routes/stocks.js'
import { startScheduler, initializeAnalysis } from './services/scheduler.js'

const app = express()
const PORT = process.env.PORT || 4000

// 미들웨어
app.use(cors())
app.use(express.json())

// 라우트
app.use('/api/stocks', stocksRouter)

// 상태 체크 엔드포인트
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  })
})

// 서버 시작
app.listen(PORT, async () => {
  console.log(`[서버] Trading Analysis Backend 시작됨`)
  console.log(`[서버] http://localhost:${PORT}`)
  console.log('')

  // 초기 데이터 로드 및 필요시 분석
  await initializeAnalysis()

  // 스케줄러 시작 (1시간마다 자동 분석)
  startScheduler()
})
