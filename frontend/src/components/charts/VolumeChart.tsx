/**
 * 거래량 차트 컴포넌트
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Box, Typography } from '@mui/material'

interface VolumeData {
  date: string
  volume: number
  change?: number
}

interface VolumeChartProps {
  data: VolumeData[]
}

export default function VolumeChart({ data }: VolumeChartProps) {
  // 날짜 포맷터
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  // 거래량 포맷터
  const formatVolume = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K`
    }
    return value.toString()
  }

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
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
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="body2">
            거래량: {payload[0].value.toLocaleString()}
          </Typography>
        </Box>
      )
    }
    return null
  }

  // 최근 30일 데이터만 표시
  const recentData = data.slice(-30)

  if (!data || data.length === 0) {
    return (
      <Box
        sx={{
          height: 150,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color="text.secondary">거래량 데이터가 없습니다</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom>
        거래량
      </Typography>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={recentData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 10 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatVolume}
            tick={{ fontSize: 10 }}
            width={50}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="volume"
            fill="#90caf9"
            radius={[2, 2, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  )
}
