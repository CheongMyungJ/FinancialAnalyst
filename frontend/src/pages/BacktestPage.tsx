import { useState, useCallback, useMemo } from 'react'
import {
  Play,
  TrendingUp,
  TrendingDown,
  Info,
  Landmark,
  LineChart,
  Gauge,
  DollarSign,
  ArrowUpDown,
  FlaskConical,
  BarChart3,
  Filter,
  ArrowDownAZ,
  ArrowUpAZ,
  ListFilter,
  PieChart,
} from 'lucide-react'
import { useAppSelector } from '../store'
import { fetchPriceHistoryForBacktest } from '../services/api/backtestApi'
import { runBacktest, type BacktestResult, type StockPriceData } from '../services/backtest/backtester'
import { DEFAULT_WEIGHTS, type IndicatorWeights } from '../services/backtest/technicalIndicators'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Slider } from '../components/ui/slider'
import { Spinner } from '../components/ui/spinner'
import { Tooltip } from '../components/ui/tooltip'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table'
import { cn } from '../lib/utils'

// 지표 설명
const INDICATOR_INFO: Record<keyof IndicatorWeights, { name: string; desc: string }> = {
  rsi: {
    name: 'RSI',
    desc: '과매수/과매도 판단. RSI 30 이하면 매수 신호, 70 이상이면 매도 신호로 해석',
  },
  macd: {
    name: 'MACD',
    desc: '추세 전환 감지. MACD가 시그널선 위로 교차하면 상승 신호',
  },
  maCrossover: {
    name: '이동평균 크로스',
    desc: '단기(20일) MA가 장기(50일) MA 위에 있으면 상승 추세',
  },
  momentum: {
    name: '모멘텀',
    desc: '최근 20일간 가격 변화율. 상승 추세의 강도를 측정',
  },
  volumeTrend: {
    name: '거래량 추세',
    desc: '최근 거래량이 평균 대비 증가하면 추세 신뢰도 상승',
  },
  bollingerBand: {
    name: '볼린저 밴드',
    desc: '가격의 상대적 위치. 하단 근처면 매수, 상단 근처면 매도 신호',
  },
  stochastic: {
    name: '스토캐스틱',
    desc: '일정 기간 내 가격 위치. 20 이하 과매도(매수), 80 이상 과매수(매도)',
  },
  adx: {
    name: 'ADX',
    desc: '추세 강도 지표. 25 이상이면 강한 추세, 방향은 +DI/-DI로 판단',
  },
  divergence: {
    name: '다이버전스',
    desc: '가격과 RSI의 괴리 감지. 상승 다이버전스는 반등 신호',
  },
  foreignFlow: {
    name: '외국인 수급',
    desc: '외국인 순매수/순매도 동향. 연속 순매수는 상승 신호',
  },
  institutionFlow: {
    name: '기관 수급',
    desc: '기관 순매수/순매도 동향. 연속 순매수는 상승 신호',
  },
}

// 프리셋 전략
const PRESETS: { name: string; weights: IndicatorWeights }[] = [
  {
    name: '균형',
    weights: {
      rsi: 10, macd: 10, maCrossover: 10, momentum: 10, volumeTrend: 8,
      bollingerBand: 8, stochastic: 8, adx: 8, divergence: 8,
      foreignFlow: 10, institutionFlow: 10
    }
  },
  {
    name: '추세추종',
    weights: {
      rsi: 5, macd: 15, maCrossover: 15, momentum: 12, volumeTrend: 5,
      bollingerBand: 5, stochastic: 5, adx: 15, divergence: 8,
      foreignFlow: 8, institutionFlow: 7
    }
  },
  {
    name: '역추세',
    weights: {
      rsi: 18, macd: 5, maCrossover: 5, momentum: 10, volumeTrend: 5,
      bollingerBand: 15, stochastic: 15, adx: 5, divergence: 12,
      foreignFlow: 5, institutionFlow: 5
    }
  },
  {
    name: '수급중심',
    weights: {
      rsi: 5, macd: 5, maCrossover: 5, momentum: 5, volumeTrend: 10,
      bollingerBand: 5, stochastic: 5, adx: 5, divergence: 5,
      foreignFlow: 25, institutionFlow: 25
    }
  },
]

export default function BacktestPage() {
  const { list } = useAppSelector((state) => state.stocks)

  // 설정 상태
  const [weights, setWeights] = useState<IndicatorWeights>(DEFAULT_WEIGHTS)
  const [evaluationPeriod, setEvaluationPeriod] = useState<number>(90)
  const [rebalanceCycle, setRebalanceCycle] = useState<number>(7)
  const [topN, setTopN] = useState<number>(1)
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>(['KOSPI', 'KOSDAQ'])

  // 실행 상태
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [progressText, setProgressText] = useState<string>('')
  const [progressPercent, setProgressPercent] = useState<number>(0)

  // UI 상태
  const [resultTab, setResultTab] = useState<'summary' | 'holdings' | 'trades'>('summary')
  const [holdingSortBy, setHoldingSortBy] = useState<'return' | 'days' | 'name'>('return')
  const [holdingSortDesc, setHoldingSortDesc] = useState(true)
  const [holdingFilter, setHoldingFilter] = useState<'all' | 'profit' | 'loss'>('all')
  const [tradeFilter, setTradeFilter] = useState<'all' | 'BUY' | 'SELL' | 'HOLD'>('all')

  // 선택된 종목 수 계산
  const selectedStockCount = useMemo(() =>
    list.filter(s => selectedMarkets.includes(s.market)).length,
    [list, selectedMarkets]
  )

  // 종목별 수익 요약 통계
  const holdingStats = useMemo(() => {
    if (!result) return null
    const holdings = result.holdingPeriods
    const profitCount = holdings.filter(h => h.return > 0).length
    const lossCount = holdings.filter(h => h.return < 0).length
    const evenCount = holdings.filter(h => h.return === 0).length
    const avgReturn = holdings.length > 0
      ? holdings.reduce((sum, h) => sum + h.return, 0) / holdings.length
      : 0
    const maxProfit = holdings.length > 0 ? Math.max(...holdings.map(h => h.return)) : 0
    const maxLoss = holdings.length > 0 ? Math.min(...holdings.map(h => h.return)) : 0
    const avgDays = holdings.length > 0
      ? holdings.reduce((sum, h) => sum + h.days, 0) / holdings.length
      : 0
    return { profitCount, lossCount, evenCount, avgReturn, maxProfit, maxLoss, avgDays }
  }, [result])

  // 정렬/필터된 종목별 수익
  const filteredHoldings = useMemo(() => {
    if (!result) return []
    let holdings = [...result.holdingPeriods]

    // 필터 적용
    if (holdingFilter === 'profit') {
      holdings = holdings.filter(h => h.return > 0)
    } else if (holdingFilter === 'loss') {
      holdings = holdings.filter(h => h.return < 0)
    }

    // 정렬 적용
    holdings.sort((a, b) => {
      let cmp = 0
      if (holdingSortBy === 'return') cmp = a.return - b.return
      else if (holdingSortBy === 'days') cmp = a.days - b.days
      else cmp = a.name.localeCompare(b.name)
      return holdingSortDesc ? -cmp : cmp
    })

    return holdings
  }, [result, holdingFilter, holdingSortBy, holdingSortDesc])

  // 필터된 거래 내역
  const filteredTrades = useMemo(() => {
    if (!result) return []
    if (tradeFilter === 'all') return result.trades
    return result.trades.filter(t => t.action === tradeFilter)
  }, [result, tradeFilter])

  const handleWeightChange = (indicator: keyof IndicatorWeights, value: number) => {
    setWeights(prev => ({ ...prev, [indicator]: value }))
  }

  const applyPreset = (preset: typeof PRESETS[0]) => {
    setWeights(preset.weights)
  }

  const toggleMarket = (market: string) => {
    if (selectedMarkets.includes(market)) {
      setSelectedMarkets(selectedMarkets.filter(m => m !== market))
    } else {
      setSelectedMarkets([...selectedMarkets, market])
    }
  }

  const runBacktestSimulation = useCallback(async () => {
    if (list.length === 0) {
      setError('종목 데이터가 없습니다. 메인 페이지에서 데이터를 불러와주세요.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setProgressPercent(0)

    try {
      const targetStocks = list.filter(stock => selectedMarkets.includes(stock.market))

      if (targetStocks.length === 0) {
        throw new Error('선택된 시장에 종목이 없습니다.')
      }

      setProgressText(`${targetStocks.length}개 종목 데이터 수집 시작...`)
      const stocksWithHistory: StockPriceData[] = []

      for (let i = 0; i < targetStocks.length; i++) {
        const stock = targetStocks[i]
        const percent = Math.round(((i + 1) / targetStocks.length) * 100)
        setProgressPercent(percent)
        setProgressText(`${stock.name} (${i + 1}/${targetStocks.length})`)

        try {
          const priceHistory = await fetchPriceHistoryForBacktest(stock.symbol, stock.market)
          if (priceHistory.length > 0) {
            stocksWithHistory.push({
              symbol: stock.symbol,
              name: stock.name,
              priceHistory,
              supplyDemand: stock.supplyDemand,  // 수급 데이터 포함
            })
          }
        } catch (err) {
          console.warn(`Failed to fetch price history for ${stock.symbol}:`, err)
        }

        const delay = targetStocks.length > 50 ? 300 : 500
        await new Promise(resolve => setTimeout(resolve, delay))
      }

      if (stocksWithHistory.length < 2) {
        throw new Error('충분한 가격 데이터를 가져오지 못했습니다.')
      }

      setProgressText('백테스트 계산 중...')
      setProgressPercent(100)

      const backtestResult = runBacktest({
        stocks: stocksWithHistory,
        weights,
        evaluationPeriodDays: evaluationPeriod,
        rebalanceCycleDays: rebalanceCycle,
        initialCapital: 10000000,
        topN,
      })

      setResult(backtestResult)
      setProgressText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '백테스트 실행 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [list, weights, evaluationPeriod, rebalanceCycle, topN, selectedMarkets])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const getMarketStockCount = (market: string) =>
    list.filter(s => s.market === market).length

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <FlaskConical className="h-8 w-8 text-cyan-500" />
          <h1 className="text-2xl font-bold text-slate-50">전략 검증</h1>
        </div>
        <p className="text-slate-400">
          기술적 지표 가중치를 설정하고 과거 데이터로 전략 성과를 검증합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 설정 패널 */}
        <div className="space-y-4">
          {/* 지표 가중치 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">지표 가중치</CardTitle>
            </CardHeader>
            <CardContent>
              {/* 프리셋 버튼 */}
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2">빠른 설정</p>
                <div className="grid grid-cols-4 gap-1">
                  {PRESETS.map(preset => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className="px-2 py-1.5 text-xs rounded-md border border-slate-700 hover:bg-slate-800 transition-colors"
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800 my-4" />

              {/* 슬라이더들 */}
              {(Object.keys(INDICATOR_INFO) as (keyof IndicatorWeights)[]).map(key => (
                <div key={key} className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm text-slate-300">{INDICATOR_INFO[key].name}</span>
                      <Tooltip content={INDICATOR_INFO[key].desc}>
                        <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
                      </Tooltip>
                    </div>
                    <span className="text-sm font-bold text-cyan-400">
                      {weights[key]}%
                    </span>
                  </div>
                  <Slider
                    value={weights[key]}
                    onChange={(v) => handleWeightChange(key, v)}
                    min={0}
                    max={100}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* 대상 시장 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">대상 시장</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { code: 'KOSPI', label: 'KOSPI', flag: '🇰🇷' },
                  { code: 'KOSDAQ', label: 'KOSDAQ', flag: '🇰🇷' },
                  { code: 'NYSE', label: 'NYSE', flag: '🇺🇸' },
                  { code: 'NASDAQ', label: 'NASDAQ', flag: '🇺🇸' },
                ].map(market => (
                  <button
                    key={market.code}
                    onClick={() => toggleMarket(market.code)}
                    className={cn(
                      'p-3 rounded-lg border text-center transition-all',
                      selectedMarkets.includes(market.code)
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                        : 'border-slate-700 hover:bg-slate-800'
                    )}
                  >
                    <p className="text-sm font-bold">
                      {market.flag} {market.label}
                    </p>
                    <p className="text-xs text-slate-500">
                      {getMarketStockCount(market.code)}개
                    </p>
                  </button>
                ))}
              </div>

              <p className="text-sm text-center text-slate-500 mt-3">
                총 <strong className="text-slate-200">{selectedStockCount}개</strong> 종목 선택됨
              </p>
            </CardContent>
          </Card>

          {/* 평가 설정 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">평가 설정</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1.5">평가 기간</label>
                <select
                  value={evaluationPeriod}
                  onChange={(e) => setEvaluationPeriod(Number(e.target.value))}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value={30}>1개월</option>
                  <option value={60}>2개월</option>
                  <option value={90}>3개월</option>
                  <option value={120}>4개월</option>
                  <option value={180}>6개월</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1.5">리밸런싱 주기</label>
                <select
                  value={rebalanceCycle}
                  onChange={(e) => setRebalanceCycle(Number(e.target.value))}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value={1}>매일</option>
                  <option value={7}>매주</option>
                  <option value={14}>2주마다</option>
                  <option value={30}>매월</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-1.5">보유 종목 수</label>
                <select
                  value={topN}
                  onChange={(e) => setTopN(Number(e.target.value))}
                  className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value={1}>1개 (집중투자)</option>
                  <option value={3}>3개</option>
                  <option value={5}>5개</option>
                  <option value={10}>10개 (분산투자)</option>
                </select>
              </div>
            </CardContent>
          </Card>

          {/* 실행 버튼 */}
          <Button
            onClick={runBacktestSimulation}
            disabled={loading || list.length === 0 || selectedStockCount === 0}
            className="w-full py-3 gap-2"
          >
            {loading ? (
              <>
                <Spinner size="sm" />
                실행 중...
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                백테스트 실행
              </>
            )}
          </Button>

          {list.length === 0 && (
            <div className="bg-amber-500/10 border border-amber-500/50 rounded-lg p-3 text-sm text-amber-400">
              메인 페이지에서 종목 데이터를 먼저 불러와주세요.
            </div>
          )}
        </div>

        {/* 결과 패널 */}
        <div className="lg:col-span-2 space-y-4">
          {/* 로딩 상태 */}
          {loading && (
            <Card>
              <CardContent className="py-8 text-center">
                <Spinner size="lg" className="mb-4" />
                <h3 className="text-lg font-medium text-slate-200 mb-2">데이터 수집 중...</h3>
                <p className="text-sm text-slate-500 mb-4">{progressText}</p>
                <Progress value={progressPercent} max={100} />
                <p className="text-sm text-slate-500 mt-2">{progressPercent}%</p>
              </CardContent>
            </Card>
          )}

          {/* 에러 */}
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/50 rounded-lg p-4 text-rose-400">
              {error}
            </div>
          )}

          {/* 결과 */}
          {result && !loading && (
            <>
              {/* 핵심 지표 카드 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card className={cn(
                  'text-center',
                  result.totalReturn >= 0 ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-rose-500/20 border-rose-500/50'
                )}>
                  <CardContent className="py-4">
                    <TrendingUp className={cn(
                      'h-7 w-7 mx-auto mb-1',
                      result.totalReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    )} />
                    <p className={cn(
                      'text-2xl font-bold',
                      result.totalReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    )}>
                      {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-400">총 수익률</p>
                  </CardContent>
                </Card>

                <Card className={cn(
                  'text-center',
                  result.excessReturn >= 0 ? 'bg-blue-500/20 border-blue-500/50' : 'bg-amber-500/20 border-amber-500/50'
                )}>
                  <CardContent className="py-4">
                    <LineChart className={cn(
                      'h-7 w-7 mx-auto mb-1',
                      result.excessReturn >= 0 ? 'text-blue-400' : 'text-amber-400'
                    )} />
                    <p className={cn(
                      'text-2xl font-bold',
                      result.excessReturn >= 0 ? 'text-blue-400' : 'text-amber-400'
                    )}>
                      {result.excessReturn >= 0 ? '+' : ''}{result.excessReturn.toFixed(1)}%
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-xs text-slate-400">벤치마크 대비</p>
                      <Tooltip content="선택한 종목들을 동일 비중으로 보유했을 때의 평균 수익률 대비 초과/미달 성과">
                        <Info className="h-3 w-3 text-slate-500 cursor-help" />
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="py-4">
                    <Gauge className="h-7 w-7 mx-auto mb-1 text-slate-400" />
                    <p className="text-2xl font-bold text-slate-200">
                      {result.winRate.toFixed(0)}%
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-xs text-slate-400">승률</p>
                      <Tooltip content="수익으로 마감한 거래 수 / 전체 거래 수. 높을수록 좋지만 수익 크기도 중요">
                        <Info className="h-3 w-3 text-slate-500 cursor-help" />
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="py-4">
                    <TrendingDown className="h-7 w-7 mx-auto mb-1 text-rose-400" />
                    <p className="text-2xl font-bold text-rose-400">
                      -{result.maxDrawdown.toFixed(1)}%
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      <p className="text-xs text-slate-400">최대 낙폭</p>
                      <Tooltip content="최고점 대비 최대 하락폭(MDD). 낮을수록 안정적인 전략. 심리적 손실 한계 파악에 중요">
                        <Info className="h-3 w-3 text-slate-500 cursor-help" />
                      </Tooltip>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 상세 결과 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">투자 결과</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Landmark className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500">초기 자본</p>
                        <p className="font-bold text-slate-200">{formatCurrency(result.initialValue)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className={cn(
                        'h-5 w-5',
                        result.finalValue >= result.initialValue ? 'text-emerald-400' : 'text-rose-400'
                      )} />
                      <div>
                        <p className="text-xs text-slate-500">최종 자본</p>
                        <p className="font-bold text-slate-200">{formatCurrency(result.finalValue)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-xs text-slate-500">거래 횟수</p>
                        <p className="font-bold text-slate-200">{result.tradeCount}회</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <LineChart className="h-5 w-5 text-slate-500" />
                      <div>
                        <div className="flex items-center gap-1">
                          <p className="text-xs text-slate-500">샤프 비율</p>
                          <Tooltip content="위험 대비 수익률. 1 이상이면 양호, 2 이상이면 우수. 변동성 대비 얼마나 효율적으로 수익을 냈는지 측정">
                            <Info className="h-3 w-3 text-slate-500 cursor-help" />
                          </Tooltip>
                        </div>
                        <p className="font-bold text-slate-200">{result.sharpeRatio.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 탭 UI - 상세 분석 */}
              <Card>
                {/* 탭 헤더 */}
                <div className="flex border-b border-slate-800">
                  <button
                    onClick={() => setResultTab('summary')}
                    className={cn(
                      'flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2',
                      resultTab === 'summary'
                        ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    )}
                  >
                    <PieChart className="h-4 w-4" />
                    요약
                  </button>
                  <button
                    onClick={() => setResultTab('holdings')}
                    className={cn(
                      'flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2',
                      resultTab === 'holdings'
                        ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    )}
                  >
                    <BarChart3 className="h-4 w-4" />
                    종목별 ({result.holdingPeriods.length})
                  </button>
                  <button
                    onClick={() => setResultTab('trades')}
                    className={cn(
                      'flex-1 px-4 py-3 text-sm font-medium transition-colors flex items-center justify-center gap-2',
                      resultTab === 'trades'
                        ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                    )}
                  >
                    <ListFilter className="h-4 w-4" />
                    거래내역 ({result.trades.length})
                  </button>
                </div>

                {/* 탭 컨텐츠 */}
                <CardContent className="pt-4">
                  {/* 요약 탭 */}
                  {resultTab === 'summary' && holdingStats && (
                    <div className="space-y-6">
                      {/* 수익/손실 통계 */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-emerald-500/10 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-emerald-400">{holdingStats.profitCount}</p>
                          <p className="text-xs text-slate-400">수익 종목</p>
                        </div>
                        <div className="bg-rose-500/10 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-rose-400">{holdingStats.lossCount}</p>
                          <p className="text-xs text-slate-400">손실 종목</p>
                        </div>
                        <div className={cn(
                          'rounded-lg p-3 text-center',
                          holdingStats.avgReturn >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'
                        )}>
                          <p className={cn(
                            'text-2xl font-bold',
                            holdingStats.avgReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          )}>
                            {holdingStats.avgReturn >= 0 ? '+' : ''}{holdingStats.avgReturn.toFixed(1)}%
                          </p>
                          <p className="text-xs text-slate-400">평균 수익률</p>
                        </div>
                        <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                          <p className="text-2xl font-bold text-slate-200">{holdingStats.avgDays.toFixed(0)}일</p>
                          <p className="text-xs text-slate-400">평균 보유기간</p>
                        </div>
                      </div>

                      {/* 수익/손실 비율 바 */}
                      <div>
                        <div className="flex justify-between text-xs text-slate-400 mb-2">
                          <span>수익 {holdingStats.profitCount}건</span>
                          <span>손실 {holdingStats.lossCount}건</span>
                        </div>
                        <div className="h-4 bg-slate-800 rounded-full overflow-hidden flex">
                          {result.holdingPeriods.length > 0 && (
                            <>
                              <div
                                className="bg-emerald-500 h-full transition-all"
                                style={{ width: `${(holdingStats.profitCount / result.holdingPeriods.length) * 100}%` }}
                              />
                              <div
                                className="bg-rose-500 h-full transition-all"
                                style={{ width: `${(holdingStats.lossCount / result.holdingPeriods.length) * 100}%` }}
                              />
                            </>
                          )}
                        </div>
                      </div>

                      {/* 종목별 수익률 막대 차트 */}
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-3">종목별 수익률</h4>
                        <div className="space-y-2 max-h-[300px] overflow-auto">
                          {[...result.holdingPeriods]
                            .sort((a, b) => b.return - a.return)
                            .map((holding, index) => {
                              const maxAbs = Math.max(
                                Math.abs(holdingStats.maxProfit),
                                Math.abs(holdingStats.maxLoss),
                                1
                              )
                              const barWidth = Math.abs(holding.return) / maxAbs * 100
                              const isProfit = holding.return >= 0

                              return (
                                <div key={index} className="flex items-center gap-2">
                                  <div className="w-24 text-xs text-slate-400 truncate" title={holding.name}>
                                    {holding.name}
                                  </div>
                                  <div className="flex-1 flex items-center">
                                    {/* 음수 영역 */}
                                    <div className="w-1/2 flex justify-end">
                                      {!isProfit && (
                                        <div
                                          className="bg-rose-500 h-5 rounded-l transition-all"
                                          style={{ width: `${barWidth}%` }}
                                        />
                                      )}
                                    </div>
                                    {/* 중앙선 */}
                                    <div className="w-px h-6 bg-slate-600" />
                                    {/* 양수 영역 */}
                                    <div className="w-1/2">
                                      {isProfit && (
                                        <div
                                          className="bg-emerald-500 h-5 rounded-r transition-all"
                                          style={{ width: `${barWidth}%` }}
                                        />
                                      )}
                                    </div>
                                  </div>
                                  <div className={cn(
                                    'w-16 text-xs text-right font-medium',
                                    isProfit ? 'text-emerald-400' : 'text-rose-400'
                                  )}>
                                    {isProfit ? '+' : ''}{holding.return.toFixed(1)}%
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </div>

                      {/* 최고/최저 */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3">
                          <p className="text-xs text-slate-400 mb-1">최고 수익</p>
                          <p className="text-xl font-bold text-emerald-400">+{holdingStats.maxProfit.toFixed(1)}%</p>
                        </div>
                        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-3">
                          <p className="text-xs text-slate-400 mb-1">최대 손실</p>
                          <p className="text-xl font-bold text-rose-400">{holdingStats.maxLoss.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 종목별 탭 */}
                  {resultTab === 'holdings' && (
                    <div className="space-y-4">
                      {/* 필터/정렬 컨트롤 */}
                      <div className="flex flex-wrap gap-2 items-center justify-between">
                        <div className="flex gap-2">
                          <select
                            value={holdingFilter}
                            onChange={(e) => setHoldingFilter(e.target.value as typeof holdingFilter)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                          >
                            <option value="all">전체</option>
                            <option value="profit">수익만</option>
                            <option value="loss">손실만</option>
                          </select>
                          <select
                            value={holdingSortBy}
                            onChange={(e) => setHoldingSortBy(e.target.value as typeof holdingSortBy)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
                          >
                            <option value="return">수익률순</option>
                            <option value="days">보유기간순</option>
                            <option value="name">종목명순</option>
                          </select>
                          <button
                            onClick={() => setHoldingSortDesc(!holdingSortDesc)}
                            className="p-1.5 rounded-lg border border-slate-700 hover:bg-slate-800"
                          >
                            {holdingSortDesc ? (
                              <ArrowDownAZ className="h-4 w-4 text-slate-400" />
                            ) : (
                              <ArrowUpAZ className="h-4 w-4 text-slate-400" />
                            )}
                          </button>
                        </div>
                        <span className="text-xs text-slate-500">
                          {filteredHoldings.length}건 표시
                        </span>
                      </div>

                      {/* 종목 리스트 */}
                      {filteredHoldings.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">해당하는 거래가 없습니다.</p>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-auto">
                          {filteredHoldings.map((holding, index) => (
                            <div
                              key={index}
                              className={cn(
                                'flex items-center justify-between p-3 rounded-lg border',
                                holding.return >= 0
                                  ? 'bg-emerald-500/5 border-emerald-500/20'
                                  : 'bg-rose-500/5 border-rose-500/20'
                              )}
                            >
                              <div className="flex-1">
                                <p className="font-medium text-slate-200">{holding.name}</p>
                                <p className="text-xs text-slate-500">{holding.symbol}</p>
                              </div>
                              <div className="text-center px-4">
                                <Badge variant="outline">{holding.days}일</Badge>
                              </div>
                              <div className="w-24 text-right">
                                <span className={cn(
                                  'text-lg font-bold',
                                  holding.return >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                )}>
                                  {holding.return >= 0 ? '+' : ''}{holding.return.toFixed(1)}%
                                </span>
                              </div>
                              {/* 미니 바 */}
                              <div className="w-20 ml-3">
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div
                                    className={cn(
                                      'h-full rounded-full',
                                      holding.return >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
                                    )}
                                    style={{
                                      width: `${Math.min(Math.abs(holding.return) * 2, 100)}%`
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 거래내역 탭 */}
                  {resultTab === 'trades' && (
                    <div className="space-y-4">
                      {/* 필터 컨트롤 */}
                      <div className="flex gap-2 items-center">
                        <Filter className="h-4 w-4 text-slate-500" />
                        <div className="flex gap-1">
                          {(['all', 'BUY', 'SELL', 'HOLD'] as const).map((filter) => (
                            <button
                              key={filter}
                              onClick={() => setTradeFilter(filter)}
                              className={cn(
                                'px-3 py-1 text-xs rounded-full transition-colors',
                                tradeFilter === filter
                                  ? filter === 'BUY' ? 'bg-emerald-500 text-white'
                                    : filter === 'SELL' ? 'bg-rose-500 text-white'
                                    : filter === 'HOLD' ? 'bg-amber-500 text-white'
                                    : 'bg-cyan-500 text-white'
                                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                              )}
                            >
                              {filter === 'all' ? '전체' : filter}
                            </button>
                          ))}
                        </div>
                        <span className="text-xs text-slate-500 ml-auto">
                          {filteredTrades.length}건
                        </span>
                      </div>

                      {/* 거래 내역 테이블 */}
                      {filteredTrades.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">해당하는 거래가 없습니다.</p>
                      ) : (
                        <div className="max-h-[400px] overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>날짜</TableHead>
                                <TableHead>액션</TableHead>
                                <TableHead>종목</TableHead>
                                <TableHead className="text-right">가격</TableHead>
                                <TableHead className="text-right">점수</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filteredTrades.map((trade, index) => (
                                <TableRow key={index}>
                                  <TableCell className="text-slate-400">{trade.date}</TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        trade.action === 'BUY' ? 'success' :
                                        trade.action === 'SELL' ? 'destructive' : 'outline'
                                      }
                                    >
                                      {trade.action}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <p className="font-medium text-slate-200">{trade.name}</p>
                                  </TableCell>
                                  <TableCell className="text-right text-slate-300">
                                    {trade.price.toLocaleString()}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {trade.action !== 'SELL' ? (
                                      <span className="text-cyan-400">{trade.score.toFixed(2)}</span>
                                    ) : '-'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}

          {/* 초기 상태 */}
          {!result && !loading && !error && (
            <Card className="border-dashed border-2 border-slate-700 bg-slate-900/50">
              <CardContent className="py-12 text-center">
                <LineChart className="h-16 w-16 mx-auto mb-4 text-slate-600" />
                <h3 className="text-lg font-medium text-slate-400 mb-2">
                  전략을 설정하고 백테스트를 실행하세요
                </h3>
                <p className="text-sm text-slate-500">
                  왼쪽에서 지표 가중치와 평가 설정을 조정한 후<br />
                  "백테스트 실행" 버튼을 클릭하세요.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
