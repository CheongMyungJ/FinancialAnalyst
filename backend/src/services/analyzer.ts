/**
 * 주식 분석 서비스 (Backend)
 * 전체 종목에 대해 데이터를 수집하고 분석합니다.
 */

import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'
import type { Stock, PriceData, NewsData, StocksResponse } from '../types/index.js'
import { ALL_STOCKS } from '../data/stockList.js'
import { getStockQuote, getHistoricalPrices } from './yahooFinance.js'
import { calculateAllTechnicalIndicators } from './technicalIndicators.js'
import { calculateAllScores } from './scoring/totalScoring.js'
import { commitAndPushData } from './gitService.js'

// 환경 변수로 자동 커밋 활성화 여부 결정
const AUTO_COMMIT = process.env.AUTO_COMMIT === 'true'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 루트 data/ 디렉토리에 저장 (GitHub에 커밋될 위치)
const DATA_DIR = path.join(__dirname, '../../../data')
const STOCKS_FILE = path.join(DATA_DIR, 'stocks.json')

let isAnalyzing = false
let lastAnalyzedData: StocksResponse | null = null

/**
 * 데이터 디렉토리 생성
 */
function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

/**
 * 저장된 데이터 로드
 */
export function loadSavedData(): StocksResponse | null {
  try {
    if (fs.existsSync(STOCKS_FILE)) {
      const data = fs.readFileSync(STOCKS_FILE, 'utf-8')
      lastAnalyzedData = JSON.parse(data)
      return lastAnalyzedData
    }
  } catch (error) {
    console.error('저장된 데이터 로드 실패:', error)
  }
  return null
}

/**
 * 데이터 저장
 */
function saveData(data: StocksResponse): void {
  ensureDataDir()
  fs.writeFileSync(STOCKS_FILE, JSON.stringify(data, null, 2))
  lastAnalyzedData = data
}

/**
 * 뉴스 데이터 생성 (임시 - API 없이 샘플 데이터)
 */
function generateSampleNewsData(symbol: string): NewsData {
  const hash = symbol.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)

  return {
    recentNews: [],
    recentDisclosures: [],
    sentimentScore: 5 + (hash % 5) - 2,
    newsCount: hash % 10,
    disclosureCount: hash % 5,
  }
}

/**
 * 단일 종목 분석 (시세만 - 메인 화면용)
 * 히스토리 데이터 없이 빠르게 분석
 */
async function analyzeStockQuoteOnly(stockInfo: typeof ALL_STOCKS[0]): Promise<Stock | null> {
  try {
    // 1. 시세 및 기본 정보만 가져오기
    const quote = await getStockQuote(stockInfo.symbol, stockInfo.market)

    // 2. 뉴스 데이터 (샘플)
    const newsData = generateSampleNewsData(stockInfo.symbol)

    // 3. 기본 기술적 지표 (히스토리 없이 기본값)
    const technicals = {
      ma20: quote.currentPrice,
      ma50: quote.currentPrice,
      ma120: quote.currentPrice,
      rsi: 50,
      macdLine: 0,
      signalLine: 0,
      histogram: 0,
      volumeAvg20: null,
      volumeChange: 0,
    }

    // 4. 점수 계산
    const scores = calculateAllScores(
      quote.fundamentals,
      technicals,
      newsData,
      quote.currentPrice,
      quote.changePercent,
      stockInfo.sector
    )

    const stock: Stock = {
      symbol: stockInfo.symbol,
      name: quote.name,
      market: stockInfo.market,
      sector: stockInfo.sector,
      currentPrice: quote.currentPrice,
      previousClose: quote.previousClose,
      change: quote.change,
      changePercent: quote.changePercent,
      currency: quote.currency,
      lastUpdated: new Date().toISOString(),
      fundamentals: quote.fundamentals,
      technicals,
      newsData,
      scores,
    }

    return stock
  } catch (error) {
    console.error(`[오류] ${stockInfo.name} 분석 실패:`, error)
    return null
  }
}

/**
 * 단일 종목 전체 분석 (히스토리 포함 - 상세 페이지용)
 */
async function analyzeStockFull(stockInfo: typeof ALL_STOCKS[0]): Promise<Stock | null> {
  try {
    // 1. 시세 및 기본 정보 가져오기
    const quote = await getStockQuote(stockInfo.symbol, stockInfo.market)

    // 2. 과거 가격 데이터 가져오기
    const priceHistory = await getHistoricalPrices(stockInfo.symbol, stockInfo.market, '6mo')

    // 3. 기술적 지표 계산
    const technicals = calculateAllTechnicalIndicators(priceHistory)

    // 4. 뉴스 데이터 (샘플)
    const newsData = generateSampleNewsData(stockInfo.symbol)

    // 5. 점수 계산
    const scores = calculateAllScores(
      quote.fundamentals,
      technicals,
      newsData,
      quote.currentPrice,
      quote.changePercent,
      stockInfo.sector
    )

    const stock: Stock = {
      symbol: stockInfo.symbol,
      name: quote.name,
      market: stockInfo.market,
      sector: stockInfo.sector,
      currentPrice: quote.currentPrice,
      previousClose: quote.previousClose,
      change: quote.change,
      changePercent: quote.changePercent,
      currency: quote.currency,
      lastUpdated: new Date().toISOString(),
      fundamentals: quote.fundamentals,
      technicals,
      newsData,
      scores,
    }

    return stock
  } catch (error) {
    console.error(`[오류] ${stockInfo.name} 분석 실패:`, error)
    return null
  }
}

/**
 * 배치 병렬 처리로 전체 종목 분석 (시세만 - 빠른 분석)
 * @param batchSize 동시에 분석할 종목 수 (기본: 30)
 * @param batchDelay 배치 간 딜레이 ms (기본: 500)
 */
export async function analyzeAllStocks(batchSize: number = 30, batchDelay: number = 500): Promise<StocksResponse> {
  if (isAnalyzing) {
    console.log('[분석] 이미 분석 중입니다.')
    return lastAnalyzedData || {
      lastUpdated: new Date().toISOString(),
      isAnalyzing: true,
      stocks: [],
    }
  }

  isAnalyzing = true
  const startTime = Date.now()
  console.log(`[분석] 전체 종목 시세 분석 시작 (${ALL_STOCKS.length}개, 배치 크기: ${batchSize})...`)

  const stocks: Stock[] = []
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  // 배치로 나누기
  const batches: (typeof ALL_STOCKS)[] = []
  for (let i = 0; i < ALL_STOCKS.length; i += batchSize) {
    batches.push(ALL_STOCKS.slice(i, i + batchSize))
  }

  console.log(`[분석] 총 ${batches.length}개 배치로 분할됨`)

  // 각 배치를 병렬로 처리
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    const progress = ((i + 1) / batches.length * 100).toFixed(0)
    console.log(`[분석] 배치 ${i + 1}/${batches.length} (${progress}%) - ${batch.length}개 종목`)

    try {
      // 배치 내 종목들을 병렬로 분석 (시세만)
      const results = await Promise.all(
        batch.map(stockInfo => analyzeStockQuoteOnly(stockInfo).catch(err => {
          console.error(`[오류] ${stockInfo.symbol} 실패:`, err.message)
          return null
        }))
      )

      // 성공한 결과만 추가
      for (const stock of results) {
        if (stock) {
          stocks.push(stock)
        }
      }

      // 마지막 배치가 아니면 딜레이
      if (i < batches.length - 1) {
        await delay(batchDelay)
      }
    } catch (error) {
      console.error(`[오류] 배치 ${i + 1} 처리 실패:`, error)
    }
  }

  const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(1)
  const response: StocksResponse = {
    lastUpdated: new Date().toISOString(),
    isAnalyzing: false,
    stocks,
  }

  // 데이터 저장
  saveData(response)

  // 자동 커밋이 활성화된 경우 GitHub에 푸시
  if (AUTO_COMMIT) {
    console.log('[분석] GitHub에 결과 커밋 중...')
    await commitAndPushData()
  }

  isAnalyzing = false
  console.log(`[분석] 전체 분석 완료! ${stocks.length}/${ALL_STOCKS.length}개 종목 (소요시간: ${elapsedTime}초)`)

  return response
}

/**
 * 현재 분석 상태 반환
 */
export function getAnalysisStatus(): { isAnalyzing: boolean; lastUpdated: string | null } {
  return {
    isAnalyzing,
    lastUpdated: lastAnalyzedData?.lastUpdated || null,
  }
}

/**
 * 캐시된 데이터 반환
 */
export function getCachedData(): StocksResponse | null {
  if (!lastAnalyzedData) {
    return loadSavedData()
  }
  return lastAnalyzedData
}

/**
 * 특정 종목 상세 데이터 가져오기 (전체 분석 + 히스토리)
 */
export async function getStockDetail(symbol: string): Promise<{
  stock: Stock | null
  priceHistory: PriceData[]
}> {
  // 종목 정보 찾기
  const stockInfo = ALL_STOCKS.find(s => s.symbol === symbol)
  if (!stockInfo) {
    return { stock: null, priceHistory: [] }
  }

  try {
    console.log(`[상세] ${stockInfo.name} (${symbol}) 전체 분석 시작...`)

    // 전체 분석 (히스토리 포함)
    const stock = await analyzeStockFull(stockInfo)

    // 가격 히스토리
    const priceHistory = await getHistoricalPrices(symbol, stockInfo.market, '6mo')

    console.log(`[상세] ${stockInfo.name} 분석 완료`)
    return { stock, priceHistory }
  } catch (error) {
    console.error(`[오류] ${symbol} 상세 분석 실패:`, error)

    // 실패시 캐시된 데이터라도 반환
    const cachedData = getCachedData()
    const cachedStock = cachedData?.stocks.find(s => s.symbol === symbol) || null
    return { stock: cachedStock, priceHistory: [] }
  }
}
