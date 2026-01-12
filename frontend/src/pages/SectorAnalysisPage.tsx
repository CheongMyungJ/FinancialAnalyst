import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Chip,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from '@mui/material'
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
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
  const { list } = useAppSelector((state) => state.stocks)

  // 섹터별 통계 계산
  const sectorStats = useMemo(() => {
    if (list.length === 0) return []

    // 시장을 지역으로 변환 (KOSPI/KOSDAQ -> KR, NYSE/NASDAQ -> US)
    const getRegion = (market: string) => {
      if (market === 'KOSPI' || market === 'KOSDAQ') return 'KR'
      if (market === 'NYSE' || market === 'NASDAQ') return 'US'
      return market
    }

    // 섹터별 그룹화 (지역 기준)
    const sectorMap = new Map<string, Stock[]>()

    list.forEach((stock) => {
      const region = getRegion(stock.market)
      const key = `${stock.sector}|${region}`
      if (!sectorMap.has(key)) {
        sectorMap.set(key, [])
      }
      sectorMap.get(key)!.push(stock)
    })

    // 섹터별 통계 계산
    const stats: SectorStats[] = []

    sectorMap.forEach((stocks, key) => {
      const [sector, region] = key.split('|')
      const count = stocks.length

      // 평균 계산
      const avgScore = stocks.reduce((sum, s) => sum + s.scores.total, 0) / count
      const avgFundamental = stocks.reduce((sum, s) => sum + s.scores.fundamental.average, 0) / count
      const avgTechnical = stocks.reduce((sum, s) => sum + s.scores.technical.average, 0) / count
      const avgNews = stocks.reduce((sum, s) => sum + s.scores.news.average, 0) / count
      const avgChangePercent = stocks.reduce((sum, s) => sum + s.changePercent, 0) / count

      // 상위 3개 종목
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

    // 평균 점수 기준 정렬
    return stats.sort((a, b) => b.avgScore - a.avgScore)
  }, [list])

  // 한국/미국 섹터 분리
  const koreanSectors = sectorStats.filter((s) => s.market === 'KR')
  const usSectors = sectorStats.filter((s) => s.market === 'US')

  if (list.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <Typography color="text.secondary">
          데이터를 불러오는 중... 메인 페이지에서 새로고침을 해주세요.
        </Typography>
      </Box>
    )
  }

  const renderSectorCard = (sector: SectorStats) => (
    <Grid item xs={12} md={6} lg={4} key={`${sector.name}-${sector.market}`}>
      <Card sx={{ height: '100%' }}>
        <CardContent>
          {/* 섹터 헤더 */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h6" gutterBottom>
                {sector.name}
              </Typography>
              <Box display="flex" gap={1}>
                <Chip
                  label={sector.market === 'KR' ? '한국' : '미국'}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                <Chip label={`${sector.stockCount}개 종목`} size="small" variant="outlined" />
              </Box>
            </Box>
            <ScoreBadge score={sector.avgScore} size="large" />
          </Box>

          {/* 평균 점수 바 */}
          <Box mb={2}>
            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">기본</Typography>
              <Typography variant="caption">{sector.avgFundamental.toFixed(1)}</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={sector.avgFundamental * 10}
              sx={{ height: 6, borderRadius: 1, mb: 1 }}
            />

            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">기술</Typography>
              <Typography variant="caption">{sector.avgTechnical.toFixed(1)}</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={sector.avgTechnical * 10}
              color="secondary"
              sx={{ height: 6, borderRadius: 1, mb: 1 }}
            />

            <Box display="flex" justifyContent="space-between" mb={0.5}>
              <Typography variant="caption" color="text.secondary">뉴스</Typography>
              <Typography variant="caption">{sector.avgNews.toFixed(1)}</Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={sector.avgNews * 10}
              color="info"
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>

          {/* 평균 등락률 */}
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            {sector.avgChangePercent >= 0 ? (
              <TrendingUpIcon color="success" fontSize="small" />
            ) : (
              <TrendingDownIcon color="error" fontSize="small" />
            )}
            <Typography
              variant="body2"
              color={sector.avgChangePercent >= 0 ? 'success.main' : 'error.main'}
            >
              평균 {sector.avgChangePercent >= 0 ? '+' : ''}
              {sector.avgChangePercent.toFixed(2)}%
            </Typography>
          </Box>

          {/* 상위 종목 */}
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            상위 종목
          </Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ py: 0.5 }}>종목</TableCell>
                <TableCell align="right" sx={{ py: 0.5 }}>점수</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sector.topStocks.map((stock, index) => (
                <TableRow
                  key={stock.symbol}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/stock/${stock.symbol}`)}
                >
                  <TableCell sx={{ py: 0.5 }}>
                    <Typography variant="body2">
                      {index + 1}. {stock.name.length > 15 ? stock.name.slice(0, 15) + '...' : stock.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ py: 0.5 }}>
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
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        섹터별 분석
      </Typography>

      {/* 요약 통계 */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">총 섹터 수</Typography>
            <Typography variant="h5">{sectorStats.length}개</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">한국 섹터</Typography>
            <Typography variant="h5">{koreanSectors.length}개</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">미국 섹터</Typography>
            <Typography variant="h5">{usSectors.length}개</Typography>
          </Grid>
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">최고 점수 섹터</Typography>
            <Typography variant="h5">
              {sectorStats[0]?.name || '-'} ({sectorStats[0]?.avgScore.toFixed(1) || '-'})
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 한국 섹터 */}
      {koreanSectors.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
            🇰🇷 한국 시장
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            {koreanSectors.map(renderSectorCard)}
          </Grid>
        </>
      )}

      {/* 미국 섹터 */}
      {usSectors.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mt: 4, mb: 2 }}>
            🇺🇸 미국 시장
          </Typography>
          <Grid container spacing={3}>
            {usSectors.map(renderSectorCard)}
          </Grid>
        </>
      )}
    </Box>
  )
}
