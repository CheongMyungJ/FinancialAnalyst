import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Stack,
  CircularProgress,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  PieChart as PieChartIcon,
  Business as BusinessIcon,
  Star as StarIcon,
} from '@mui/icons-material'
import { useAppSelector } from '../store'
import type { Stock } from '../types'
import ScoreBadge from '../components/scoring/ScoreBadge'

interface SectorStats {
  name: string
  market: string
  stockCount: number
  avgScore: number
  avgFundamental: number
  avgTechnical: number
  avgNews: number
  avgChangePercent: number
  topStocks: Stock[]
}

export default function SectorAnalysisPage() {
  const navigate = useNavigate()
  const { list, loading } = useAppSelector((state) => state.stocks)

  // 섹터별 통계 계산
  const sectorStats = useMemo(() => {
    if (list.length === 0) return []

    const getRegion = (market: string) => {
      if (market === 'KOSPI' || market === 'KOSDAQ') return 'KR'
      if (market === 'NYSE' || market === 'NASDAQ') return 'US'
      return market
    }

    const sectorMap = new Map<string, Stock[]>()

    list.forEach((stock) => {
      const region = getRegion(stock.market)
      const key = `${stock.sector}|${region}`
      if (!sectorMap.has(key)) {
        sectorMap.set(key, [])
      }
      sectorMap.get(key)!.push(stock)
    })

    const stats: SectorStats[] = []

    sectorMap.forEach((stocks, key) => {
      const [sector, region] = key.split('|')
      const count = stocks.length

      const avgScore = stocks.reduce((sum, s) => sum + s.scores.total, 0) / count
      const avgFundamental = stocks.reduce((sum, s) => sum + s.scores.fundamental.average, 0) / count
      const avgTechnical = stocks.reduce((sum, s) => sum + s.scores.technical.average, 0) / count
      const avgNews = stocks.reduce((sum, s) => sum + s.scores.news.average, 0) / count
      const avgChangePercent = stocks.reduce((sum, s) => sum + s.changePercent, 0) / count

      const topStocks = [...stocks]
        .sort((a, b) => b.scores.total - a.scores.total)
        .slice(0, 3)

      stats.push({
        name: sector,
        market: region,
        stockCount: count,
        avgScore,
        avgFundamental,
        avgTechnical,
        avgNews,
        avgChangePercent,
        topStocks,
      })
    })

    return stats.sort((a, b) => b.avgScore - a.avgScore)
  }, [list])

  const koreanSectors = sectorStats.filter((s) => s.market === 'KR')
  const usSectors = sectorStats.filter((s) => s.market === 'US')

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    )
  }

  if (list.length === 0) {
    return (
      <Paper
        sx={{
          p: 6,
          textAlign: 'center',
          bgcolor: 'grey.50',
          border: '2px dashed',
          borderColor: 'grey.300',
        }}
      >
        <PieChartIcon sx={{ fontSize: 64, color: 'grey.400', mb: 2 }} />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          데이터가 없습니다
        </Typography>
        <Typography variant="body2" color="text.secondary">
          메인 페이지에서 새로고침 버튼을 눌러 데이터를 불러와주세요.
        </Typography>
      </Paper>
    )
  }

  const renderSectorCard = (sector: SectorStats) => (
    <Grid item xs={12} sm={6} lg={4} key={`${sector.name}-${sector.market}`}>
      <Card
        sx={{
          height: '100%',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: 4,
          },
        }}
      >
        <CardContent sx={{ p: 2.5 }}>
          {/* 섹터 헤더 */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                noWrap
                title={sector.name}
              >
                {sector.name}
              </Typography>
              <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
                <Chip
                  label={sector.market === 'KR' ? '🇰🇷' : '🇺🇸'}
                  size="small"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
                <Chip
                  label={`${sector.stockCount}개`}
                  size="small"
                  variant="outlined"
                  sx={{ fontSize: '0.7rem', height: 20 }}
                />
              </Stack>
            </Box>
            <ScoreBadge score={sector.avgScore} size="large" />
          </Box>

          {/* 평균 점수 바 */}
          <Box mb={2}>
            {[
              { label: '기본', value: sector.avgFundamental, color: 'primary' as const },
              { label: '기술', value: sector.avgTechnical, color: 'secondary' as const },
              { label: '뉴스', value: sector.avgNews, color: 'info' as const },
            ].map((item) => (
              <Box key={item.label} sx={{ mb: 1 }}>
                <Box display="flex" justifyContent="space-between" mb={0.25}>
                  <Typography variant="caption" color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="caption" fontWeight="bold">
                    {item.value.toFixed(1)}
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(item.value * 10, 100)}
                  color={item.color}
                  sx={{ height: 4, borderRadius: 1 }}
                />
              </Box>
            ))}
          </Box>

          {/* 평균 등락률 */}
          <Paper
            variant="outlined"
            sx={{
              p: 1,
              mb: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              bgcolor: sector.avgChangePercent >= 0 ? 'success.50' : 'error.50',
              borderColor: sector.avgChangePercent >= 0 ? 'success.200' : 'error.200',
            }}
          >
            {sector.avgChangePercent >= 0 ? (
              <TrendingUpIcon fontSize="small" color="success" />
            ) : (
              <TrendingDownIcon fontSize="small" color="error" />
            )}
            <Typography
              variant="body2"
              fontWeight="bold"
              color={sector.avgChangePercent >= 0 ? 'success.main' : 'error.main'}
            >
              {sector.avgChangePercent >= 0 ? '+' : ''}
              {sector.avgChangePercent.toFixed(2)}%
            </Typography>
          </Paper>

          {/* 상위 종목 */}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
            <StarIcon sx={{ fontSize: 14 }} /> TOP 3
          </Typography>
          <Table size="small">
            <TableBody>
              {sector.topStocks.map((stock, index) => (
                <TableRow
                  key={stock.symbol}
                  hover
                  sx={{
                    cursor: 'pointer',
                    '&:last-child td': { border: 0 },
                  }}
                  onClick={() => navigate(`/stock/${stock.symbol}`)}
                >
                  <TableCell sx={{ py: 0.75, pl: 0, width: 24 }}>
                    <Typography variant="caption" color="text.secondary">
                      {index + 1}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ py: 0.75 }}>
                    <Typography variant="body2" noWrap sx={{ maxWidth: 120 }}>
                      {stock.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.75, pr: 0 }}>
                    <ScoreBadge score={stock.scores.total} size="small" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Grid>
  )

  return (
    <Box>
      {/* 헤더 */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <PieChartIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            섹터 분석
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          업종별 평균 점수와 등락률을 비교하고, 각 섹터의 상위 종목을 확인합니다.
        </Typography>
      </Box>

      {/* 요약 통계 */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <BusinessIcon sx={{ fontSize: 28, color: 'text.secondary', mb: 0.5 }} />
              <Typography variant="h4" fontWeight="bold">
                {sectorStats.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                전체 섹터
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" sx={{ mb: 0.5 }}>🇰🇷</Typography>
              <Typography variant="h4" fontWeight="bold">
                {koreanSectors.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                한국 섹터
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="h5" sx={{ mb: 0.5 }}>🇺🇸</Typography>
              <Typography variant="h4" fontWeight="bold">
                {usSectors.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                미국 섹터
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} md={3}>
          <Card sx={{ bgcolor: 'warning.50' }}>
            <CardContent sx={{ textAlign: 'center', py: 2 }}>
              <StarIcon sx={{ fontSize: 28, color: 'warning.main', mb: 0.5 }} />
              <Typography variant="h6" fontWeight="bold" noWrap>
                {sectorStats[0]?.name || '-'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                최고 점수 ({sectorStats[0]?.avgScore.toFixed(1) || '-'})
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* 한국 섹터 */}
      {koreanSectors.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            🇰🇷 한국 시장
            <Chip label={`${koreanSectors.length}개 섹터`} size="small" />
          </Typography>
          <Grid container spacing={2}>
            {koreanSectors.map(renderSectorCard)}
          </Grid>
        </Box>
      )}

      {/* 미국 섹터 */}
      {usSectors.length > 0 && (
        <Box>
          <Typography variant="h5" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            🇺🇸 미국 시장
            <Chip label={`${usSectors.length}개 섹터`} size="small" />
          </Typography>
          <Grid container spacing={2}>
            {usSectors.map(renderSectorCard)}
          </Grid>
        </Box>
      )}
    </Box>
  )
}
