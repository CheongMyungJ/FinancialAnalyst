/**
 * 주식 분석 실행 스크립트
 * GitHub Actions에서 스케줄로 실행됩니다.
 */

import { analyzeAllStocks } from './services/analyzer.js'

async function main() {
  console.log('=== Stock Analysis Started ===')
  console.log(`Time: ${new Date().toISOString()}`)
  console.log('')

  try {
    const result = await analyzeAllStocks()

    console.log('')
    console.log('=== Analysis Completed ===')
    console.log(`Total stocks analyzed: ${result.stocks.length}`)
    console.log(`Last updated: ${result.lastUpdated}`)
  } catch (error) {
    console.error('Analysis failed:', error)
    process.exit(1)
  }
}

main()
