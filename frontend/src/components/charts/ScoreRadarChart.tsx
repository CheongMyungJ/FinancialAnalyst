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
import type { StockScores } from '../../types'

interface ScoreRadarChartProps {
  scores: StockScores
}

export default function ScoreRadarChart({ scores }: ScoreRadarChartProps) {
  // 레이더 차트용 데이터 변환 (카테고리별 평균 점수 사용)
  const data = [
    { subject: '기본적 분석', score: scores.fundamental.average, fullMark: 10 },
    { subject: '기술적 분석', score: scores.technical.average, fullMark: 10 },
    { subject: '뉴스/공시', score: scores.news.average, fullMark: 10 },
    { subject: '수급 분석', score: scores.supplyDemand?.average ?? 5, fullMark: 10 },
  ]

  // 상세 지표별 데이터
  const detailedData = [
    { subject: 'PER', score: scores.fundamental.per, fullMark: 10 },
    { subject: 'ROE', score: scores.fundamental.roe, fullMark: 10 },
    { subject: '성장성', score: (scores.fundamental.epsGrowth + scores.fundamental.revenueGrowth) / 2, fullMark: 10 },
    { subject: '안정성', score: (scores.fundamental.debtRatio + scores.fundamental.currentRatio) / 2, fullMark: 10 },
    { subject: '이평선', score: scores.technical.maPosition, fullMark: 10 },
    { subject: 'RSI', score: scores.technical.rsi, fullMark: 10 },
    { subject: 'MACD', score: scores.technical.macd, fullMark: 10 },
    { subject: '추세강도', score: scores.technical.adx, fullMark: 10 },
    { subject: '뉴스', score: scores.news.sentiment, fullMark: 10 },
    { subject: '외국인', score: scores.supplyDemand?.foreignFlow ?? 5, fullMark: 10 },
    { subject: '기관', score: scores.supplyDemand?.institutionFlow ?? 5, fullMark: 10 },
  ]

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-2 shadow-xl">
          <p className="text-sm font-bold text-slate-200">{item.subject}</p>
          <p className="text-sm text-cyan-400">
            {item.score.toFixed(1)} / 10
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-slate-200 mb-2">항목별 점수 분포</h4>
      <ResponsiveContainer width="100%" height={350}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="#334155" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fontSize: 11, fill: '#94a3b8' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fontSize: 10, fill: '#64748b' }}
            tickCount={6}
            stroke="#475569"
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="점수"
            dataKey="score"
            stroke="#06b6d4"
            fill="#06b6d4"
            fillOpacity={0.3}
            strokeWidth={2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
