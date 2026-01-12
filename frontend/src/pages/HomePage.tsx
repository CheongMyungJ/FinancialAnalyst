import { Box, Grid, Paper, Typography, Stack } from '@mui/material'
import { EmojiEvents as TrophyIcon } from '@mui/icons-material'
import RankingTable from '../components/ranking/RankingTable'
import RankingFilters from '../components/ranking/RankingFilters'
import WeightSliders from '../components/scoring/WeightSliders'

export default function HomePage() {
  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
          <TrophyIcon sx={{ fontSize: 32, color: 'warning.main' }} />
          <Typography variant="h4" component="h1" fontWeight="bold">
            종목 랭킹
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          기본적 분석, 기술적 분석, 뉴스 분석을 종합한 점수로 종목을 평가합니다.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* 좌측: 필터 및 가중치 설정 */}
        <Grid item xs={12} md={3}>
          <Stack spacing={2}>
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                필터
              </Typography>
              <RankingFilters />
            </Paper>

            <Paper sx={{ p: 2.5 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                점수 가중치
              </Typography>
              <WeightSliders />
            </Paper>
          </Stack>
        </Grid>

        {/* 우측: 랭킹 테이블 */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 0, overflow: 'hidden' }}>
            <RankingTable />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
