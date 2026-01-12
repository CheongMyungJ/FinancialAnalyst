/**
 * 주식 API 라우트 (Backend)
 */

import { Router, Request, Response } from 'express'
import {
  getCachedData,
  getAnalysisStatus,
  analyzeAllStocks,
  getStockDetail,
} from '../services/analyzer.js'

const router = Router()

/**
 * GET /api/stocks/status
 * 분석 상태 반환
 */
router.get('/status', (_req: Request, res: Response) => {
  const status = getAnalysisStatus()
  res.json(status)
})

/**
 * POST /api/stocks/refresh
 * 수동 분석 요청
 */
router.post('/refresh', async (_req: Request, res: Response) => {
  const status = getAnalysisStatus()

  if (status.isAnalyzing) {
    res.status(409).json({
      message: '이미 분석이 진행 중입니다.',
      isAnalyzing: true,
    })
    return
  }

  // 비동기로 분석 시작 (응답은 즉시 반환)
  analyzeAllStocks().catch(error => {
    console.error('수동 분석 중 오류:', error)
  })

  res.json({
    message: '분석이 시작되었습니다.',
    isAnalyzing: true,
  })
})

/**
 * GET /api/stocks
 * 전체 종목 데이터 반환
 */
router.get('/', (_req: Request, res: Response) => {
  const data = getCachedData()

  if (!data) {
    res.status(503).json({
      error: '데이터가 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.',
      isAnalyzing: getAnalysisStatus().isAnalyzing,
    })
    return
  }

  res.json(data)
})

/**
 * GET /api/stocks/:symbol
 * 특정 종목 상세 데이터 반환
 */
router.get('/:symbol', async (req: Request, res: Response) => {
  const { symbol } = req.params

  try {
    const detail = await getStockDetail(symbol)

    if (!detail.stock) {
      res.status(404).json({ error: '종목을 찾을 수 없습니다.' })
      return
    }

    res.json(detail)
  } catch (error) {
    console.error(`종목 상세 조회 오류: ${symbol}`, error)
    res.status(500).json({ error: '종목 데이터를 가져오는데 실패했습니다.' })
  }
})

export default router
