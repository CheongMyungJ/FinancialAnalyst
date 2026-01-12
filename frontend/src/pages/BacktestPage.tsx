import { useState, useCallback, useMemo } from 'react'
import {
  Play,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronDown,
  ChevronUp,
  Landmark,
  LineChart,
  Gauge,
  DollarSign,
  ArrowUpDown,
  FlaskConical,
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
  { name: '균형', weights: { rsi: 15, macd: 15, maCrossover: 15, momentum: 15, volumeTrend: 10, foreignFlow: 15, institutionFlow: 15 } },
  { name: '추세추종', weights: { rsi: 10, macd: 25, maCrossover: 25, momentum: 15, volumeTrend: 5, foreignFlow: 10, institutionFlow: 10 } },
  { name: '역추세', weights: { rsi: 35, macd: 10, maCrossover: 10, momentum: 25, volumeTrend: 5, foreignFlow: 7, institutionFlow: 8 } },
  { name: '수급중심', weights: { rsi: 10, macd: 10, maCrossover: 10, momentum: 10, volumeTrend: 10, foreignFlow: 25, institutionFlow: 25 } },
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
  const [showTradeHistory, setShowTradeHistory] = useState(false)

  // 선택된 종목 수 계산
  const selectedStockCount = useMemo(() =>
    list.filter(s => selectedMarkets.includes(s.market)).length,
    [list, selectedMarkets]
  )

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
                    <p className="text-xs text-slate-400">벤치마크 대비</p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="py-4">
                    <Gauge className="h-7 w-7 mx-auto mb-1 text-slate-400" />
                    <p className="text-2xl font-bold text-slate-200">
                      {result.winRate.toFixed(0)}%
                    </p>
                    <p className="text-xs text-slate-400">승률</p>
                  </CardContent>
                </Card>

                <Card className="text-center">
                  <CardContent className="py-4">
                    <TrendingDown className="h-7 w-7 mx-auto mb-1 text-rose-400" />
                    <p className="text-2xl font-bold text-rose-400">
                      -{result.maxDrawdown.toFixed(1)}%
                    </p>
                    <p className="text-xs text-slate-400">최대 낙폭</p>
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
                        <p className="text-xs text-slate-500">샤프 비율</p>
                        <p className="font-bold text-slate-200">{result.sharpeRatio.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 종목별 보유 기록 */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">종목별 수익</CardTitle>
                </CardHeader>
                <CardContent>
                  {result.holdingPeriods.length === 0 ? (
                    <p className="text-center text-slate-500 py-4">보유 기록이 없습니다.</p>
                  ) : (
                    <div className="max-h-[300px] overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>종목</TableHead>
                            <TableHead className="text-center">보유 기간</TableHead>
                            <TableHead className="text-right">수익률</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.holdingPeriods.map((holding, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <p className="font-medium text-slate-200">{holding.name}</p>
                                <p className="text-xs text-slate-500">{holding.symbol}</p>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="outline">{holding.days}일</Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge variant={holding.return >= 0 ? 'success' : 'error'}>
                                  {holding.return >= 0 ? (
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3 mr-1" />
                                  )}
                                  {holding.return >= 0 ? '+' : ''}{holding.return.toFixed(1)}%
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 거래 내역 (접을 수 있음) */}
              <Card>
                <button
                  onClick={() => setShowTradeHistory(!showTradeHistory)}
                  className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                >
                  <span className="font-semibold text-slate-200">
                    전체 거래 내역 ({result.trades.length}건)
                  </span>
                  {showTradeHistory ? (
                    <ChevronUp className="h-5 w-5 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-500" />
                  )}
                </button>
                {showTradeHistory && (
                  <>
                    <div className="border-t border-slate-800" />
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
                          {result.trades.map((trade, index) => (
                            <TableRow key={index}>
                              <TableCell>{trade.date}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    trade.action === 'BUY' ? 'success' :
                                    trade.action === 'SELL' ? 'error' : 'outline'
                                  }
                                >
                                  {trade.action}
                                </Badge>
                              </TableCell>
                              <TableCell>{trade.name}</TableCell>
                              <TableCell className="text-right">
                                {trade.price.toLocaleString()}
                              </TableCell>
                              <TableCell className="text-right">
                                {trade.action !== 'SELL' ? trade.score.toFixed(2) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                )}
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
