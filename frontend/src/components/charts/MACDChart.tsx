/**
 * MACD 차트 컴포넌트
 */

import {
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from 'recharts'

interface MACDData {
  date: string
  macdLine: number | null
  signalLine: number | null
  histogram: number | null
}

interface MACDChartProps {
  data: MACDData[]
}

export default function MACDChart({ data }: MACDChartProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const macd = payload.find((p: any) => p.dataKey === 'macdLine')?.value
      const signal = payload.find((p: any) => p.dataKey === 'signalLine')?.value
      const hist = payload.find((p: any) => p.dataKey === 'histogram')?.value

      if (macd == null) return null

      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 shadow-xl">
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          <p className="text-sm text-cyan-400">MACD: {macd?.toFixed(2)}</p>
          <p className="text-sm text-amber-400">Signal: {signal?.toFixed(2)}</p>
          <p className={`text-sm ${hist >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            Histogram: {hist?.toFixed(2)}
          </p>
        </div>
      )
    }
    return null
  }

  // 유효한 데이터만 필터링
  const validData = data.filter(d => d.macdLine !== null)

  if (validData.length === 0) {
    return (
      <div className="h-[150px] flex items-center justify-center text-slate-500 text-sm">
        MACD 데이터가 없습니다
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm font-medium text-slate-200">MACD (12, 26, 9)</h4>
        <div className="flex gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-cyan-400 inline-block" />
            <span className="text-slate-400">MACD</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-amber-400 inline-block" />
            <span className="text-slate-400">Signal</span>
          </span>
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
            tick={{ fontSize: 10, fill: '#94a3b8' }}
            width={40}
            stroke="#475569"
            tickFormatter={(v) => v.toFixed(0)}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#475569" />
          <Bar
            dataKey="histogram"
            name="Histogram"
            fill="#475569"
            // 양수는 녹색, 음수는 빨간색
            shape={(props: any) => {
              const { x, y, width, height, value } = props
              const fill = value >= 0 ? '#10b981' : '#f43f5e'
              return <rect x={x} y={y} width={width} height={height} fill={fill} opacity={0.7} />
            }}
          />
          <Line
            type="monotone"
            dataKey="macdLine"
            name="MACD"
            stroke="#06b6d4"
            dot={false}
            strokeWidth={1.5}
          />
          <Line
            type="monotone"
            dataKey="signalLine"
            name="Signal"
            stroke="#f59e0b"
            dot={false}
            strokeWidth={1.5}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
