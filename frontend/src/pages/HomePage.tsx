import { Box, Grid, Paper, Typography } from '@mui/material'
import RankingTable from '../components/ranking/RankingTable'
import RankingFilters from '../components/ranking/RankingFilters'
import WeightSliders from '../components/scoring/WeightSliders'

export default function HomePage() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 }}>
        주식 종목 평가 랭킹
      </Typography>

      <Grid container spacing={3}>
        {/* 좌측: 필터 및 가중치 설정 */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              필터
            </Typography>
            <RankingFilters />
          </Paper>

          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              가중치 설정
            </Typography>
            <WeightSliders />
          </Paper>
        </Grid>

        {/* 우측: 랭킹 테이블 */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2 }}>
            <RankingTable />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
