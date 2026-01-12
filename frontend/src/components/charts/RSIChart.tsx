/**
 * RSI 차트 컴포넌트
 */

import {
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
  Area,
} from 'recharts'

interface RSIData {
  date: string
  rsi: number | null
}

interface RSIChartProps {
  data: RSIData[]
}

export default function RSIChart({ data }: RSIChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length && payload[0].value != null) {
      const rsi = payload[0].value
      let status = '중립'
      let color = '#94a3b8'
      if (rsi >= 70) {
        status = '과매수'
        color = '#f43f5e'
      } else if (rsi <= 30) {
        status = '과매도'
        color = '#10b981'
      }

      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 shadow-xl">
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <p className="text-sm font-medium" style={{ color }}>
            RSI: {rsi.toFixed(1)} ({status})
          </p>
        </div>
      )
    }
    return null
  }

  // 유효한 데이터만 필터링
  const validData = data.filter(d => d.rsi !== null)

  if (validData.length === 0) {
    return (
      <div className="h-[150px] flex items-center justify-center text-slate-500 text-sm">
        RSI 데이터가 없습니다
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium text-slate-200">RSI (14)</h4>
        <div className="flex gap-3 text-xs">
          <span className="text-rose-400">과매수 70↑</span>
          <span className="text-emerald-400">과매도 30↓</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={150}>
        <ComposedChart data={validData}>
          <defs>
            <linearGradient id="rsiGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            interval="preserveStartEnd"
            stroke="#475569"
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 30, 50, 70, 100]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            width={30}
            stroke="#475569"
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={70} stroke="#f43f5e" strokeDasharray="3 3" />
          <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
          <ReferenceLine y={50} stroke="#475569" strokeDasharray="2 2" />
          <Area
            type="monotone"
            dataKey="rsi"
            stroke="#06b6d4"
            fill="url(#rsiGradient)"
            strokeWidth={1.5}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
