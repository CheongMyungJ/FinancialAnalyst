/**
 * 주가 차트 컴포넌트
 */

import { useState } from 'react'
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
import { cn } from '../../lib/utils'

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

  const getFilteredData = () => {
    const days = period === '1M' ? 30 : period === '3M' ? 90 : 180
    return data.slice(-days)
  }

  const filteredData = getFilteredData()

  const formatPrice = (value: number) => {
    if (currency === 'KRW') {
      return value >= 10000
        ? `${(value / 10000).toFixed(1)}만`
        : value.toLocaleString()
    }
    return `$${value.toFixed(2)}`
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 shadow-xl">
          <p className="text-xs text-slate-400 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatPrice(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] flex items-center justify-center text-slate-500">
        차트 데이터가 없습니다
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-sm font-medium text-slate-200">주가 추이</h4>
        <div className="flex gap-1">
          {(['1M', '3M', '6M'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                'px-3 py-1 text-xs rounded-md transition-colors',
                period === p
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              )}
            >
              {p === '1M' ? '1개월' : p === '3M' ? '3개월' : '6개월'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={filteredData}>
          <defs>
            <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            interval="preserveStartEnd"
            stroke="#475569"
          />
          <YAxis
            tickFormatter={formatPrice}
            tick={{ fontSize: 11, fill: '#94a3b8' }}
            domain={['auto', 'auto']}
            width={60}
            stroke="#475569"
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px' }}
            formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="close"
            name="종가"
            stroke="#06b6d4"
            fillOpacity={1}
            fill="url(#colorClose)"
            strokeWidth={2}
          />
          {filteredData[0]?.ma20 && (
            <Line
              type="monotone"
              dataKey="ma20"
              name="MA20"
              stroke="#f59e0b"
              dot={false}
              strokeWidth={1.5}
            />
          )}
          {filteredData[0]?.ma50 && (
            <Line
              type="monotone"
              dataKey="ma50"
              name="MA50"
              stroke="#10b981"
              dot={false}
              strokeWidth={1.5}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
