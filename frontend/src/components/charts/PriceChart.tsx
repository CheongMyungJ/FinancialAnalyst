/**
 * 주가 차트 컴포넌트
 * 종가, 이동평균선을 표시하는 Area Chart
 */

import {
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  ComposedChart,
} from 'recharts'
import { Box, Typography, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useState } from 'react'

interface PriceData {
  date: string
  close: number
  ma20?: number
  ma50?: number
  volume?: number
}

interface PriceChartProps {
  data: PriceData[]
  currency: 'KRW' | 'USD'
}

export default function PriceChart({ data, currency }: PriceChartProps) {
  const [period, setPeriod] = useState<'1M' | '3M' | '6M'>('3M')

  // 기간에 따른 데이터 필터링
  const getFilteredData = () => {
    const days = period === '1M' ? 30 : period === '3M' ? 90 : 180
    return data.slice(-days)
  }

  const filteredData = getFilteredData()

  // 가격 포맷터
  const formatPrice = (value: number) => {
    if (currency === 'KRW') {
      return value >= 10000
        ? `${(value / 10000).toFixed(1)}만`
        : value.toLocaleString()
    }
    return `$${value.toFixed(2)}`
  }

  // 날짜 포맷터
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  // 툴팁 포맷터
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Box
          sx={{
            bgcolor: 'background.paper',
            p: 1.5,
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            boxShadow: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography
              key={index}
              variant="body2"
              sx={{ color: entry.color }}
            >
              {entry.name}: {formatPrice(entry.value)}
            </Typography>
          ))}
        </Box>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <Box
        sx={{
          height: 300,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography color="text.secondary">차트 데이터가 없습니다</Typography>
      </Box>
    )
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle2">주가 추이</Typography>
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(_, value) => value && setPeriod(value)}
          size="small"
        >
          <ToggleButton value="1M">1개월</ToggleButton>
          <ToggleButton value="3M">3개월</ToggleButton>
          <ToggleButton value="6M">6개월</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={filteredData}>
          <defs>
            <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1976d2" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#1976d2" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={formatPrice}
            tick={{ fontSize: 12 }}
            domain={['auto', 'auto']}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Area
            type="monotone"
            dataKey="close"
            name="종가"
            stroke="#1976d2"
            fillOpacity={1}
            fill="url(#colorClose)"
            strokeWidth={2}
          />
          {filteredData[0]?.ma20 && (
            <Line
              type="monotone"
              dataKey="ma20"
              name="MA20"
              stroke="#ff9800"
              dot={false}
              strokeWidth={1.5}
            />
          )}
          {filteredData[0]?.ma50 && (
            <Line
              type="monotone"
              dataKey="ma50"
              name="MA50"
              stroke="#4caf50"
              dot={false}
              strokeWidth={1.5}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  )
}
