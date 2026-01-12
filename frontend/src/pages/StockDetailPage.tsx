import { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Button,
  CircularProgress,
  Chip,
  Divider,
  Alert,
  Link,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material'
import {
  ArrowBack as ArrowBackIcon,
  Business as BusinessIcon,
  Newspaper as NewspaperIcon,
  OpenInNew as OpenInNewIcon,
} from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../store'
import { fetchStockDetail, clearSelectedStock } from '../store/stockSlice'
import ScoreBreakdown from '../components/scoring/ScoreBreakdown'
import PriceChart from '../components/charts/PriceChart'
import VolumeChart from '../components/charts/VolumeChart'
import ScoreRadarChart from '../components/charts/ScoreRadarChart'
import type { PriceData } from '../types'

// 이동평균 계산
function calculateMA(prices: PriceData[], period: number): (number | undefined)[] {
  return prices.map((_, i) => {
    if (i < period - 1) return undefined
    const slice = prices.slice(i - period + 1, i + 1)
    return slice.reduce((sum, p) => sum + p.close, 0) / period
  })
}

// 섹터별 기업 설명
const SECTOR_DESCRIPTIONS: Record<string, string> = {
  // 한국 섹터
  '전기전자': '반도체, 디스플레이, 전자부품, 가전제품 등을 제조하는 기업입니다.',
  '서비스업': 'IT 서비스, 플랫폼, 게임, 통신 등 서비스를 제공하는 기업입니다.',
  '운수장비': '자동차, 자동차 부품, 조선 등 운송장비를 제조하는 기업입니다.',
  '화학': '석유화학, 정밀화학, 화장품 등 화학제품을 제조하는 기업입니다.',
  '철강금속': '철강, 비철금속, 금속가공 제품을 제조하는 기업입니다.',
  '은행': '예금, 대출, 금융 서비스를 제공하는 금융기관입니다.',
  '보험': '생명보험, 손해보험 등 보험 서비스를 제공하는 기업입니다.',
  '증권': '주식, 채권 거래 및 자산관리 서비스를 제공하는 금융기관입니다.',
  '건설업': '건축, 토목, 플랜트 등 건설 사업을 영위하는 기업입니다.',
  '의약품': '의약품, 바이오 제품을 연구개발 및 제조하는 기업입니다.',
  '식품': '식품, 음료를 제조 및 판매하는 기업입니다.',
  '유통업': '백화점, 마트, 편의점 등 유통 사업을 영위하는 기업입니다.',
  '기계': '산업기계, 정밀기기 등을 제조하는 기업입니다.',
  '전기가스': '전력, 가스 등 에너지를 생산 및 공급하는 기업입니다.',
  '금융': '종합금융 서비스를 제공하는 기업입니다.',
  // 미국 섹터
  'Technology': 'Develops and sells technology products including software, hardware, and IT services.',
  'Consumer Cyclical': 'Sells discretionary goods and services that consumers buy when they have extra income.',
  'Financial Services': 'Provides financial services including banking, insurance, and investment management.',
  'Healthcare': 'Develops pharmaceuticals, medical devices, and provides healthcare services.',
  'Communication Services': 'Provides communication and media services including telecom and entertainment.',
  'Consumer Defensive': 'Produces essential goods that consumers need regardless of economic conditions.',
  'Industrials': 'Manufactures industrial goods, machinery, and provides industrial services.',
  'Energy': 'Explores, produces, and refines oil, gas, and renewable energy.',
  'Materials': 'Produces raw materials including chemicals, metals, and construction materials.',
  'Utilities': 'Provides essential utility services including electricity, water, and gas.',
  'Real Estate': 'Owns, develops, and manages real estate properties.',
}

// 뉴스 검색 링크 생성
function getNewsLinks(name: string, symbol: string, market: string) {
  const isKorean = market === 'KOSPI' || market === 'KOSDAQ'
  const searchName = encodeURIComponent(name)
  const searchSymbol = encodeURIComponent(symbol)

  if (isKorean) {
    return [
      { name: '네이버 뉴스', url: `https://search.naver.com/search.naver?where=news&query=${searchName}` },
      { name: '네이버 금융', url: `https://finance.naver.com/item/main.naver?code=${symbol}` },
      { name: '다음 뉴스', url: `https://search.daum.net/search?w=news&q=${searchName}` },
      { name: 'Google 뉴스', url: `https://news.google.com/search?q=${searchName}&hl=ko&gl=KR` },
    ]
  } else {
    return [
      { name: 'Yahoo Finance', url: `https://finance.yahoo.com/quote/${searchSymbol}` },
      { name: 'Google News', url: `https://news.google.com/search?q=${searchName}&hl=en&gl=US` },
      { name: 'MarketWatch', url: `https://www.marketwatch.com/investing/stock/${searchSymbol.toLowerCase()}` },
      { name: 'Seeking Alpha', url: `https://seekingalpha.com/symbol/${searchSymbol}` },
    ]
  }
}

export default function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { selectedStock, selectedStockPriceHistory, loading, error } = useAppSelector(
    (state) => state.stocks
  )

  // 종목 변경 시 이전 데이터 초기화 후 새 데이터 로드
  useEffect(() => {
    // 먼저 이전 종목 데이터 초기화
    dispatch(clearSelectedStock())

    if (symbol) {
      dispatch(fetchStockDetail(symbol))
    }
  }, [dispatch, symbol])

  // 이동평균이 추가된 가격 데이터
  const priceHistory = useMemo(() => {
    if (selectedStockPriceHistory.length === 0) return []

    const ma20Values = calculateMA(selectedStockPriceHistory, 20)
    const ma50Values = calculateMA(selectedStockPriceHistory, 50)

    return selectedStockPriceHistory.map((p, i) => ({
      ...p,
      ma20: ma20Values[i],
      ma50: ma50Values[i],
    }))
  }, [selectedStockPriceHistory])

  const chartLoading = loading && selectedStockPriceHistory.length === 0

  if (loading && !selectedStock) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          뒤로가기
        </Button>
        <Alert severity="error">{error}</Alert>
      </Box>
    )
  }

  if (!selectedStock) {
    return (
      <Box>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          뒤로가기
        </Button>
        <Alert severity="warning">
          종목 정보를 찾을 수 없습니다. 먼저 메인 페이지에서 새로고침을 해주세요.
        </Alert>
      </Box>
    )
  }

  const { name, market, sector, currentPrice, change, changePercent, currency, scores } =
    selectedStock

  // 기업 설명 및 뉴스 링크
  const sectorDescription = SECTOR_DESCRIPTIONS[sector] || `${sector} 섹터에 속한 기업입니다.`
  const newsLinks = getNewsLinks(name, symbol || '', market)

  const formatPrice = (price: number) => {
    return currency === 'KRW'
      ? price.toLocaleString('ko-KR') + '원'
      : '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2 })
  }

  return (
    <Box>
      <Button startIcon={<ArrowBackIcon />} onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        뒤로가기
      </Button>

      {/* 종목 헤더 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" gap={2} mb={2} flexWrap="wrap">
          <Typography variant="h4">{name}</Typography>
          <Chip label={symbol} size="small" variant="outlined" />
          <Chip label={market} size="small" color="primary" />
          <Chip label={sector} size="small" variant="outlined" />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              현재가
            </Typography>
            <Typography variant="h5">{formatPrice(currentPrice)}</Typography>
            <Typography
              variant="body1"
              color={change >= 0 ? 'success.main' : 'error.main'}
            >
              {change >= 0 ? '+' : ''}
              {formatPrice(change)} ({changePercent >= 0 ? '+' : ''}
              {changePercent.toFixed(2)}%)
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              종합 점수
            </Typography>
            <Typography variant="h3" color="primary">
              {scores.total.toFixed(1)}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              / 10점
            </Typography>
          </Grid>

          <Grid item xs={12} sm={4}>
            <Typography variant="body2" color="text.secondary">
              카테고리별 점수
            </Typography>
            <Box display="flex" gap={2} mt={1}>
              <Box>
                <Typography variant="caption" color="text.secondary">기본</Typography>
                <Typography variant="h6">{scores.fundamental.average.toFixed(1)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">기술</Typography>
                <Typography variant="h6">{scores.technical.average.toFixed(1)}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">뉴스</Typography>
                <Typography variant="h6">{scores.news.average.toFixed(1)}</Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* 차트 섹션 */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            {chartLoading ? (
              <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height={400}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }} color="text.secondary">
                  차트 데이터 로딩중...
                </Typography>
              </Box>
            ) : priceHistory.length === 0 ? (
              <Box display="flex" justifyContent="center" alignItems="center" height={400}>
                <Typography color="text.secondary">차트 데이터가 없습니다</Typography>
              </Box>
            ) : (
              <>
                <PriceChart data={priceHistory} currency={currency} />
                <Divider sx={{ my: 2 }} />
                <VolumeChart data={priceHistory} />
              </>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <ScoreRadarChart scores={scores} />
          </Paper>
        </Grid>
      </Grid>

      {/* 점수 상세 및 재무 정보 */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              점수 상세
            </Typography>
            <ScoreBreakdown scores={scores} />
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              재무 지표
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">PER</Typography>
                <Typography variant="h6">
                  {selectedStock.fundamentals.per?.toFixed(2) || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">PBR</Typography>
                <Typography variant="h6">
                  {selectedStock.fundamentals.pbr?.toFixed(2) || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">ROE</Typography>
                <Typography variant="h6">
                  {selectedStock.fundamentals.roe?.toFixed(2) || 'N/A'}%
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">영업이익률</Typography>
                <Typography variant="h6">
                  {selectedStock.fundamentals.operatingMargin?.toFixed(2) || 'N/A'}%
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">EPS</Typography>
                <Typography variant="h6">
                  {selectedStock.fundamentals.eps?.toFixed(2) || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">시가총액</Typography>
                <Typography variant="h6">
                  {selectedStock.fundamentals.marketCap
                    ? currency === 'KRW'
                      ? `${(selectedStock.fundamentals.marketCap / 1e12).toFixed(1)}조`
                      : `$${(selectedStock.fundamentals.marketCap / 1e9).toFixed(1)}B`
                    : 'N/A'}
                </Typography>
              </Grid>
            </Grid>

            <Divider sx={{ my: 2 }} />

            <Typography variant="h6" gutterBottom>
              기술적 지표
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">RSI</Typography>
                <Typography variant="h6">
                  {selectedStock.technicals.rsi?.toFixed(1) || 'N/A'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="body2" color="text.secondary">거래량 변화</Typography>
                <Typography variant="h6">
                  {selectedStock.technicals.volumeChange
                    ? `${selectedStock.technicals.volumeChange > 0 ? '+' : ''}${selectedStock.technicals.volumeChange.toFixed(1)}%`
                    : 'N/A'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>

      {/* 기업 정보 및 뉴스 섹션 */}
      <Grid container spacing={3} sx={{ mt: 1 }}>
        {/* 기업 정보 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <BusinessIcon color="primary" />
              <Typography variant="h6">기업 정보</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <Grid container spacing={2}>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">종목코드</Typography>
                <Typography variant="body1" fontWeight="medium">{symbol}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">시장</Typography>
                <Typography variant="body1" fontWeight="medium">{market}</Typography>
              </Grid>
              <Grid item xs={4}>
                <Typography variant="body2" color="text.secondary">섹터</Typography>
                <Typography variant="body1" fontWeight="medium">{sector}</Typography>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                업종 설명
              </Typography>
              <Typography variant="body1">
                {sectorDescription}
              </Typography>
            </Box>
          </Paper>
        </Grid>

        {/* 관련 뉴스 링크 */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Box display="flex" alignItems="center" gap={1} mb={2}>
              <NewspaperIcon color="primary" />
              <Typography variant="h6">관련 뉴스 및 정보</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />

            <List dense>
              {newsLinks.map((link, index) => (
                <ListItem
                  key={index}
                  component={Link}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    bgcolor: 'grey.50',
                    '&:hover': { bgcolor: 'primary.light', color: 'primary.contrastText' },
                    textDecoration: 'none',
                    color: 'inherit',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <OpenInNewIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={link.name}
                    secondary={`${name} 관련 뉴스 보기`}
                  />
                </ListItem>
              ))}
            </List>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              * 외부 사이트로 연결됩니다
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
