/**
 * 점수 레이더 차트 컴포넌트
 * 10개 평가 항목의 점수를 레이더 차트로 시각화
 */

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { Box, Typography } from '@mui/material'
import type { StockScores } from '../../types'

interface ScoreRadarChartProps {
  scores: StockScores
}

export default function ScoreRadarChart({ scores }: ScoreRadarChartProps) {
  // 레이더 차트용 데이터 변환
  const data = [
    { subject: 'PER', score: scores.fundamental.per, fullMark: 10 },
    { subject: 'PBR', score: scores.fundamental.pbr, fullMark: 10 },
    { subject: 'ROE', score: scores.fundamental.roe, fullMark: 10 },
    { subject: '영업이익률', score: scores.fundamental.operatingMargin, fullMark: 10 },
    { subject: '이평선', score: scores.technical.maPosition, fullMark: 10 },
    { subject: 'RSI', score: scores.technical.rsi, fullMark: 10 },
    { subject: '거래량', score: scores.technical.volumeTrend, fullMark: 10 },
    { subject: 'MACD', score: scores.technical.macd, fullMark: 10 },
    { subject: '감성', score: scores.news.sentiment, fullMark: 10 },
    { subject: '빈도', score: scores.news.frequency, fullMark: 10 },
  ]

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 1,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            {item.subject}
          </Typography>
          <Typography variant="body2" color="primary">
            {item.score.toFixed(1)} / 10
          </Typography>
        </Box>
      )
    }
    return null
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        항목별 점수 분포
      </Typography>
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#e0e0e0" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: '#666' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fontSize: 10 }}
            tickCount={6}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="점수"
            dataKey="score"
            stroke="#1976d2"
            fill="#1976d2"
            fillOpacity={0.4}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </Box>
  )
}
