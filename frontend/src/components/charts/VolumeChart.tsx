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
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-xl">
          <p className="text-xs text-slate-400">{label}</p>
          <p className="text-sm text-slate-200">
            거래량: {payload[0].value.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[150px] flex items-center justify-center">
        <p className="text-slate-500">거래량 데이터가 없습니다</p>
      </div>
    )
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-slate-200 mb-2">거래량</h4>
      <ResponsiveContainer width="100%" height={150}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            interval="preserveStartEnd"
            stroke="#475569"
          />
          <YAxis
            tickFormatter={formatVolume}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            width={50}
            stroke="#475569"
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar
            dataKey="volume"
            fill="#8b5cf6"
            radius={[2, 2, 0, 0]}
            fillOpacity={0.8}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
