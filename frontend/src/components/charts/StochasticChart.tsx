/**
 * 스토캐스틱 차트 컴포넌트
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
} from 'recharts'

interface StochasticData {
  date: string
  k: number | null
  d: number | null
}

interface StochasticChartProps {
  data: StochasticData[]
}

export default function StochasticChart({ data }: StochasticChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const k = payload.find((p: any) => p.dataKey === 'k')?.value
      const d = payload.find((p: any) => p.dataKey === 'd')?.value

      if (k == null) return null

      let status = '중립'
      let color = '#94a3b8'
      if (k >= 80) {
        status = '과매수'
        color = '#f43f5e'
      } else if (k <= 20) {
        status = '과매도'
        color = '#10b981'
      }

      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 shadow-xl">
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <p className="text-sm" style={{ color }}>
            %K: {k?.toFixed(1)} ({status})
          </p>
          {d != null && (
            <p className="text-sm text-amber-400">
              %D: {d?.toFixed(1)}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  // 유효한 데이터만 필터링
  const validData = data.filter(d => d.k !== null)

  if (validData.length === 0) {
    return (
      <div className="h-[150px] flex items-center justify-center text-slate-500 text-sm">
        스토캐스틱 데이터가 없습니다
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium text-slate-200">Stochastic (14, 3)</h4>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
            <span className="text-slate-400">%K</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-amber-400 inline-block" />
            <span className="text-slate-400">%D</span>
          </span>
          <span className="text-rose-400">과매수 80↑</span>
          <span className="text-emerald-400">과매도 20↓</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={150}>
        <ComposedChart data={validData}>
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
            ticks={[0, 20, 50, 80, 100]}
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            width={30}
            stroke="#475569"
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={80} stroke="#f43f5e" strokeDasharray="3 3" />
          <ReferenceLine y={20} stroke="#10b981" strokeDasharray="3 3" />
          <ReferenceLine y={50} stroke="#475569" strokeDasharray="2 2" />
          <Line
            type="monotone"
            dataKey="k"
            name="%K"
            stroke="#06b6d4"
            dot={false}
            strokeWidth={1.5}
          />
          <Line
            type="monotone"
            dataKey="d"
            name="%D"
            stroke="#f59e0b"
            dot={false}
            strokeWidth={1.5}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
