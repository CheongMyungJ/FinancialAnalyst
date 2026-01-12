import { useState, useCallback } from 'react'
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
} from '@mui/material'
import {
  PlayArrow as PlayIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material'
import { useAppSelector } from '../store'
import { fetchPriceHistoryForBacktest } from '../services/api/backtestApi'
import { runBacktest, type BacktestResult, type StockPriceData } from '../services/backtest/backtester'
import { DEFAULT_WEIGHTS, type IndicatorWeights } from '../services/backtest/technicalIndicators'

export default function BacktestPage() {
  const { list } = useAppSelector((state) => state.stocks)

  // 설정 상태
  const [weights, setWeights] = useState<IndicatorWeights>(DEFAULT_WEIGHTS)
  const [evaluationPeriod, setEvaluationPeriod] = useState<number>(90) // 일
  const [rebalanceCycle, setRebalanceCycle] = useState<number>(7) // 일
  const [topN, setTopN] = useState<number>(1) // 상위 N개 종목

  // 실행 상태
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<BacktestResult | null>(null)
  const [progress, setProgress] = useState<string>('')

  const handleWeightChange = (indicator: keyof IndicatorWeights) => (
    _: Event,
    value: number | number[]
  ) => {
    setWeights(prev => ({ ...prev, [indicator]: value as number }))
  }

  const runBacktestSimulation = useCallback(async () => {
    if (list.length === 0) {
      setError('종목 데이터가 없습니다. 메인 페이지에서 데이터를 불러와주세요.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // 가격 히스토리 가져오기
      setProgress('가격 데이터 수집 중...')
      const stocksWithHistory: StockPriceData[] = []

      // 최대 20개 종목으로 제한 (API 호출 제한)
      const targetStocks = list.slice(0, 20)

      for (let i = 0; i < targetStocks.length; i++) {
        const stock = targetStocks[i]
        setProgress(`가격 데이터 수집 중... (${i + 1}/${targetStocks.length}) ${stock.name}`)

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

        // API 제한 방지
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      if (stocksWithHistory.length < 2) {
        throw new Error('충분한 가격 데이터를 가져오지 못했습니다.')
      }

      setProgress('백테스트 실행 중...')

      const backtestResult = runBacktest({
        stocks: stocksWithHistory,
        weights,
        evaluationPeriodDays: evaluationPeriod,
        rebalanceCycleDays: rebalanceCycle,
        initialCapital: 10000000, // 1천만원
        topN,
      })

      setResult(backtestResult)
      setProgress('')
    } catch (err) {
      setError(err instanceof Error ? err.message : '백테스트 실행 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }, [list, weights, evaluationPeriod, rebalanceCycle, topN])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(value)
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        전략 검증 (백테스트)
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        기술적 지표만 사용하여 과거 데이터 기반 전략을 검증합니다.
        기본적 분석과 뉴스 점수는 과거 데이터가 없어 백테스트에서 제외됩니다.
      </Alert>

      <Grid container spacing={3}>
        {/* 설정 패널 */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              지표 가중치 설정
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
              합계: {totalWeight}% (100%로 정규화됨)
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>RSI: {weights.rsi}%</Typography>
              <Slider
                value={weights.rsi}
                onChange={handleWeightChange('rsi')}
                min={0}
                max={100}
                valueLabelDisplay="auto"
              />

              <Typography gutterBottom>MACD: {weights.macd}%</Typography>
              <Slider
                value={weights.macd}
                onChange={handleWeightChange('macd')}
                min={0}
                max={100}
                valueLabelDisplay="auto"
              />

              <Typography gutterBottom>이동평균 크로스: {weights.maCrossover}%</Typography>
              <Slider
                value={weights.maCrossover}
                onChange={handleWeightChange('maCrossover')}
                min={0}
                max={100}
                valueLabelDisplay="auto"
              />

              <Typography gutterBottom>모멘텀: {weights.momentum}%</Typography>
              <Slider
                value={weights.momentum}
                onChange={handleWeightChange('momentum')}
                min={0}
                max={100}
                valueLabelDisplay="auto"
              />

              <Typography gutterBottom>거래량 추세: {weights.volumeTrend}%</Typography>
              <Slider
                value={weights.volumeTrend}
                onChange={handleWeightChange('volumeTrend')}
                min={0}
                max={100}
                valueLabelDisplay="auto"
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            <Typography variant="h6" gutterBottom>
              평가 설정
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>평가 기간</InputLabel>
              <Select
                value={evaluationPeriod}
                label="평가 기간"
                onChange={(e) => setEvaluationPeriod(e.target.value as number)}
              >
                <MenuItem value={30}>1개월 (30일)</MenuItem>
                <MenuItem value={60}>2개월 (60일)</MenuItem>
                <MenuItem value={90}>3개월 (90일)</MenuItem>
                <MenuItem value={120}>4개월 (120일)</MenuItem>
                <MenuItem value={180}>6개월 (180일)</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>리밸런싱 주기</InputLabel>
              <Select
                value={rebalanceCycle}
                label="리밸런싱 주기"
                onChange={(e) => setRebalanceCycle(e.target.value as number)}
              >
                <MenuItem value={1}>매일</MenuItem>
                <MenuItem value={7}>매주</MenuItem>
                <MenuItem value={14}>2주</MenuItem>
                <MenuItem value={30}>매월</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>보유 종목 수</InputLabel>
              <Select
                value={topN}
                label="보유 종목 수"
                onChange={(e) => setTopN(e.target.value as number)}
              >
                <MenuItem value={1}>1개 (집중 투자)</MenuItem>
                <MenuItem value={3}>3개</MenuItem>
                <MenuItem value={5}>5개</MenuItem>
                <MenuItem value={10}>10개</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayIcon />}
              onClick={runBacktestSimulation}
              disabled={loading || list.length === 0}
            >
              {loading ? progress || '실행 중...' : '백테스트 실행'}
            </Button>

            {list.length === 0 && (
              <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                메인 페이지에서 종목 데이터를 먼저 불러와주세요.
              </Typography>
            )}
          </Paper>
        </Grid>

        {/* 결과 패널 */}
        <Grid item xs={12} md={8}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {result && (
            <>
              {/* 요약 카드 */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        총 수익률
                      </Typography>
                      <Typography
                        variant="h5"
                        color={result.totalReturn >= 0 ? 'success.main' : 'error.main'}
                      >
                        {result.totalReturn >= 0 ? '+' : ''}{result.totalReturn.toFixed(2)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        벤치마크 대비
                      </Typography>
                      <Typography
                        variant="h5"
                        color={result.excessReturn >= 0 ? 'success.main' : 'error.main'}
                      >
                        {result.excessReturn >= 0 ? '+' : ''}{result.excessReturn.toFixed(2)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        승률
                      </Typography>
                      <Typography variant="h5">
                        {result.winRate.toFixed(1)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="body2" color="text.secondary">
                        최대 낙폭
                      </Typography>
                      <Typography variant="h5" color="error.main">
                        -{result.maxDrawdown.toFixed(2)}%
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* 상세 정보 */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  상세 결과
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">초기 자본</Typography>
                    <Typography variant="body1">{formatCurrency(result.initialValue)}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">최종 자본</Typography>
                    <Typography variant="body1">{formatCurrency(result.finalValue)}</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">거래 횟수</Typography>
                    <Typography variant="body1">{result.tradeCount}회</Typography>
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <Typography variant="body2" color="text.secondary">샤프 비율</Typography>
                    <Typography variant="body1">{result.sharpeRatio.toFixed(2)}</Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* 보유 기록 */}
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  종목별 보유 기록
                </Typography>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>종목</TableCell>
                      <TableCell align="right">보유 기간</TableCell>
                      <TableCell align="right">수익률</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.holdingPeriods.map((holding, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body2">{holding.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {holding.symbol}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{holding.days}일</TableCell>
                        <TableCell align="right">
                          <Box display="flex" alignItems="center" justifyContent="flex-end" gap={0.5}>
                            {holding.return >= 0 ? (
                              <TrendingUpIcon fontSize="small" color="success" />
                            ) : (
                              <TrendingDownIcon fontSize="small" color="error" />
                            )}
                            <Typography
                              variant="body2"
                              color={holding.return >= 0 ? 'success.main' : 'error.main'}
                            >
                              {holding.return >= 0 ? '+' : ''}{holding.return.toFixed(2)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>

              {/* 거래 내역 */}
              <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom>
                  거래 내역
                </Typography>
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
                        <TableRow key={index}>
                          <TableCell>{trade.date}</TableCell>
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
              </Paper>
            </>
          )}

          {!result && !loading && (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                왼쪽에서 지표 가중치와 평가 설정을 조정한 후
                <br />
                "백테스트 실행" 버튼을 클릭하세요.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  )
}
