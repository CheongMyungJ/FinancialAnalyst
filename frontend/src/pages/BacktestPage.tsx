import { useState, useCallback, useMemo } from 'react'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Slider,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  FormGroup,
  FormControlLabel,
  Checkbox,
  LinearProgress,
  Tooltip,
  IconButton,
  Collapse,
  Stack,
  ButtonGroup,
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AccountBalance as AccountBalanceIcon,
  Timeline as TimelineIcon,
  Speed as SpeedIcon,
  ShowChart as ShowChartIcon,
  AttachMoney as MoneyIcon,
  SwapVert as SwapVertIcon,
} from '@mui/icons-material'
import { useAppSelector } from '../store'
import { fetchPriceHistoryForBacktest } from '../services/api/backtestApi'
import { runBacktest, type BacktestResult, type StockPriceData } from '../services/backtest/backtester'
import { DEFAULT_WEIGHTS, type IndicatorWeights } from '../services/backtest/technicalIndicators'

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
}

// 프리셋 전략
const PRESETS: { name: string; weights: IndicatorWeights }[] = [
  { name: '균형', weights: { rsi: 20, macd: 20, maCrossover: 20, momentum: 20, volumeTrend: 20 } },
  { name: '추세추종', weights: { rsi: 10, macd: 30, maCrossover: 30, momentum: 20, volumeTrend: 10 } },
  { name: '역추세', weights: { rsi: 40, macd: 10, maCrossover: 10, momentum: 30, volumeTrend: 10 } },
  { name: '거래량중심', weights: { rsi: 15, macd: 15, maCrossover: 15, momentum: 15, volumeTrend: 40 } },
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

  const handleWeightChange = (indicator: keyof IndicatorWeights) => (
    _: Event,
    value: number | number[]
  ) => {
    setWeights(prev => ({ ...prev, [indicator]: value as number }))
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
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
          전략 검증
        </Typography>
        <Typography variant="body1" color="text.secondary">
          기술적 지표 가중치를 설정하고 과거 데이터로 전략 성과를 검증합니다.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 설정 패널 */}
        <Grid item xs={12} md={4}>
          <Stack spacing={2}>
            {/* 지표 가중치 */}
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                지표 가중치
              </Typography>

              {/* 프리셋 버튼 */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  빠른 설정
                </Typography>
                <ButtonGroup size="small" fullWidth>
                  {PRESETS.map(preset => (
                    <Button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      variant="outlined"
                    >
                      {preset.name}
                    </Button>
                  ))}
                </ButtonGroup>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* 슬라이더들 */}
              {(Object.keys(INDICATOR_INFO) as (keyof IndicatorWeights)[]).map(key => (
                <Box key={key} sx={{ mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Typography variant="body2">{INDICATOR_INFO[key].name}</Typography>
                      <Tooltip title={INDICATOR_INFO[key].desc} arrow placement="top">
                        <IconButton size="small" sx={{ p: 0.25 }}>
                          <InfoIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {weights[key]}%
                    </Typography>
                  </Box>
                  <Slider
                    value={weights[key]}
                    onChange={handleWeightChange(key)}
                    min={0}
                    max={100}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              ))}
            </Paper>

            {/* 대상 시장 */}
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                대상 시장
              </Typography>

              <Grid container spacing={1}>
                {[
                  { code: 'KOSPI', label: 'KOSPI', flag: '🇰🇷' },
                  { code: 'KOSDAQ', label: 'KOSDAQ', flag: '🇰🇷' },
                  { code: 'NYSE', label: 'NYSE', flag: '🇺🇸' },
                  { code: 'NASDAQ', label: 'NASDAQ', flag: '🇺🇸' },
                ].map(market => (
                  <Grid item xs={6} key={market.code}>
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        cursor: 'pointer',
                        textAlign: 'center',
                        bgcolor: selectedMarkets.includes(market.code) ? 'primary.main' : 'transparent',
                        color: selectedMarkets.includes(market.code) ? 'white' : 'text.primary',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: selectedMarkets.includes(market.code) ? 'primary.dark' : 'action.hover',
                        },
                      }}
                      onClick={() => toggleMarket(market.code)}
                    >
                      <Typography variant="body2" fontWeight="bold">
                        {market.flag} {market.label}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        {getMarketStockCount(market.code)}개
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Typography variant="body2" sx={{ mt: 2, textAlign: 'center' }} color="text.secondary">
                총 <strong>{selectedStockCount}개</strong> 종목 선택됨
              </Typography>
            </Paper>

            {/* 평가 설정 */}
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                평가 설정
              </Typography>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>평가 기간</InputLabel>
                <Select
                  value={evaluationPeriod}
                  label="평가 기간"
                  onChange={(e) => setEvaluationPeriod(e.target.value as number)}
                >
                  <MenuItem value={30}>1개월</MenuItem>
                  <MenuItem value={60}>2개월</MenuItem>
                  <MenuItem value={90}>3개월</MenuItem>
                  <MenuItem value={120}>4개월</MenuItem>
                  <MenuItem value={180}>6개월</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                <InputLabel>리밸런싱 주기</InputLabel>
                <Select
                  value={rebalanceCycle}
                  label="리밸런싱 주기"
                  onChange={(e) => setRebalanceCycle(e.target.value as number)}
                >
                  <MenuItem value={1}>매일</MenuItem>
                  <MenuItem value={7}>매주</MenuItem>
                  <MenuItem value={14}>2주마다</MenuItem>
                  <MenuItem value={30}>매월</MenuItem>
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>보유 종목 수</InputLabel>
                <Select
                  value={topN}
                  label="보유 종목 수"
                  onChange={(e) => setTopN(e.target.value as number)}
                >
                  <MenuItem value={1}>1개 (집중투자)</MenuItem>
                  <MenuItem value={3}>3개</MenuItem>
                  <MenuItem value={5}>5개</MenuItem>
                  <MenuItem value={10}>10개 (분산투자)</MenuItem>
                </Select>
              </FormControl>
            </Paper>

            {/* 실행 버튼 */}
            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
              onClick={runBacktestSimulation}
              disabled={loading || list.length === 0 || selectedStockCount === 0}
              sx={{ py: 1.5 }}
            >
              {loading ? '실행 중...' : '백테스트 실행'}
            </Button>

            {list.length === 0 && (
              <Alert severity="warning" variant="outlined">
                메인 페이지에서 종목 데이터를 먼저 불러와주세요.
              </Alert>
            )}
          </Stack>
        </Grid>

        {/* 결과 패널 */}
        <Grid item xs={12} md={8}>
          {/* 로딩 상태 */}
          {loading && (
            <Paper sx={{ p: 4 }}>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <CircularProgress size={48} sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  데이터 수집 중...
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {progressText}
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={progressPercent}
                sx={{ height: 8, borderRadius: 1 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                {progressPercent}%
              </Typography>
            </Paper>
          )}

          {/* 에러 */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {/* 결과 */}
          {result && !loading && (
            <Stack spacing={2}>
              {/* 핵심 지표 카드 */}
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Card sx={{
                    bgcolor: result.totalReturn >= 0 ? 'success.main' : 'error.main',
                    color: 'white',
                  }}>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <TrendingUpIcon sx={{ fontSize: 28, mb: 0.5, opacity: 0.9 }} />
                      <Typography variant="h5" fontWeight="bold">
                        {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn.toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        총 수익률
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card sx={{
                    bgcolor: result.excessReturn >= 0 ? 'info.main' : 'warning.main',
                    color: 'white',
                  }}>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <ShowChartIcon sx={{ fontSize: 28, mb: 0.5, opacity: 0.9 }} />
                      <Typography variant="h5" fontWeight="bold">
                        {result.excessReturn >= 0 ? '+' : ''}{result.excessReturn.toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.9 }}>
                        벤치마크 대비
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <SpeedIcon sx={{ fontSize: 28, mb: 0.5, color: 'text.secondary' }} />
                      <Typography variant="h5" fontWeight="bold">
                        {result.winRate.toFixed(0)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        승률
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent sx={{ textAlign: 'center', py: 2 }}>
                      <TrendingDownIcon sx={{ fontSize: 28, mb: 0.5, color: 'error.main' }} />
                      <Typography variant="h5" fontWeight="bold" color="error.main">
                        -{result.maxDrawdown.toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        최대 낙폭
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* 상세 결과 */}
              <Paper sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  투자 결과
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccountBalanceIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">초기 자본</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatCurrency(result.initialValue)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <MoneyIcon color={result.finalValue >= result.initialValue ? 'success' : 'error'} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">최종 자본</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {formatCurrency(result.finalValue)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SwapVertIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">거래 횟수</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {result.tradeCount}회
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TimelineIcon color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">샤프 비율</Typography>
                        <Typography variant="body1" fontWeight="bold">
                          {result.sharpeRatio.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              {/* 종목별 보유 기록 */}
              <Paper sx={{ p: 2.5 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  종목별 수익
                </Typography>
                {result.holdingPeriods.length === 0 ? (
                  <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                    보유 기록이 없습니다.
                  </Typography>
                ) : (
                  <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>종목</TableCell>
                          <TableCell align="center">보유 기간</TableCell>
                          <TableCell align="right">수익률</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.holdingPeriods.map((holding, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {holding.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {holding.symbol}
                              </Typography>
                            </TableCell>
                            <TableCell align="center">
                              <Chip label={`${holding.days}일`} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                icon={holding.return >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                label={`${holding.return >= 0 ? '+' : ''}${holding.return.toFixed(1)}%`}
                                size="small"
                                color={holding.return >= 0 ? 'success' : 'error'}
                                variant="outlined"
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
              </Paper>

              {/* 거래 내역 (접을 수 있음) */}
              <Paper sx={{ overflow: 'hidden' }}>
                <Box
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                  onClick={() => setShowTradeHistory(!showTradeHistory)}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    전체 거래 내역 ({result.trades.length}건)
                  </Typography>
                  <IconButton size="small">
                    {showTradeHistory ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                <Collapse in={showTradeHistory}>
                  <Divider />
                  <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>날짜</TableCell>
                          <TableCell>액션</TableCell>
                          <TableCell>종목</TableCell>
                          <TableCell align="right">가격</TableCell>
                          <TableCell align="right">점수</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {result.trades.map((trade, index) => (
                          <TableRow key={index} hover>
                            <TableCell>
                              <Typography variant="body2">{trade.date}</Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={trade.action}
                                size="small"
                                color={
                                  trade.action === 'BUY' ? 'success' :
                                  trade.action === 'SELL' ? 'error' : 'default'
                                }
                                variant={trade.action === 'HOLD' ? 'outlined' : 'filled'}
                              />
                            </TableCell>
                            <TableCell>{trade.name}</TableCell>
                            <TableCell align="right">
                              {trade.price.toLocaleString()}
                            </TableCell>
                            <TableCell align="right">
                              {trade.action !== 'SELL' ? trade.score.toFixed(2) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </Collapse>
              </Paper>
            </Stack>
          )}

          {/* 초기 상태 */}
          {!result && !loading && !error && (
            <Paper
              sx={{
                p: 6,
                textAlign: 'center',
                bgcolor: 'grey.50',
                border: '2px dashed',
                borderColor: 'grey.300',
              }}
            >
              <ShowChartIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                전략을 설정하고 백테스트를 실행하세요
              </Typography>
              <Typography variant="body2" color="text.secondary">
                왼쪽에서 지표 가중치와 평가 설정을 조정한 후<br />
                "백테스트 실행" 버튼을 클릭하세요.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}
