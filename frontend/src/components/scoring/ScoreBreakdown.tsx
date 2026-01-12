import { useState } from 'react'
import { Info, ChevronDown } from 'lucide-react'
import type { StockScores } from '../../types'
import { Progress } from '../ui/progress'
import { Tooltip } from '../ui/tooltip'
import { cn } from '../../lib/utils'

interface ScoreBreakdownProps {
  scores: StockScores
  showDetails?: boolean
}

interface ScoreRowProps {
  label: string
  score: number
  maxScore?: number
  description: string
  criteria: string
}

function ScoreRow({ label, score, maxScore = 10, description, criteria }: ScoreRowProps) {
  const [expanded, setExpanded] = useState(false)

  const getVariant = (s: number): 'success' | 'default' | 'warning' | 'error' => {
    if (s >= 8) return 'success'
    if (s >= 6) return 'default'
    if (s >= 4) return 'warning'
    return 'error'
  }

  const getEvaluation = (s: number) => {
    if (s >= 8) return '매우 좋음'
    if (s >= 6) return '좋음'
    if (s >= 4) return '보통'
    return '주의 필요'
  }

  return (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-slate-300">{label}</span>
          <Tooltip content={description}>
            <Info className="h-3.5 w-3.5 text-slate-500 cursor-help" />
          </Tooltip>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{getEvaluation(score)}</span>
          <span className="text-sm font-bold text-slate-200">{score.toFixed(1)}</span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-0.5 hover:bg-slate-800 rounded transition-colors"
          >
            <ChevronDown
              className={cn(
                'h-4 w-4 text-slate-500 transition-transform',
                expanded && 'rotate-180'
              )}
            />
          </button>
        </div>
      </div>
      <Progress value={score * 10} max={100} variant={getVariant(score)} />
      {expanded && (
        <div className="mt-2 p-2.5 bg-slate-800/50 rounded-lg text-xs text-slate-400">
          <strong className="text-slate-300">평가 기준:</strong> {criteria}
        </div>
      )}
    </div>
  )
}

const scoreDescriptions = {
  fundamental: {
    per: {
      description: 'PER(주가수익비율)은 주가를 주당순이익으로 나눈 값입니다.',
      criteria: 'PER 10 이하: 8~10점 (저평가), PER 10~20: 5~7점 (적정), PER 20 이상: 1~4점 (고평가).'
    },
    pbr: {
      description: 'PBR(주가순자산비율)은 주가를 주당순자산으로 나눈 값입니다.',
      criteria: 'PBR 1 미만: 8~10점 (저평가), PBR 1~3: 5~7점 (적정), PBR 3 이상: 1~4점 (고평가).'
    },
    roe: {
      description: 'ROE(자기자본이익률)는 자기자본 대비 얼마나 이익을 냈는지 나타냅니다.',
      criteria: 'ROE 15% 이상: 8~10점, ROE 10~15%: 6~7점, ROE 5~10%: 4~5점, ROE 5% 미만: 1~3점.'
    },
    operatingMargin: {
      description: '영업이익률은 매출액 대비 영업이익의 비율입니다.',
      criteria: '영업이익률 20% 이상: 8~10점, 10~20%: 5~7점, 5~10%: 3~5점, 5% 미만: 1~3점.'
    },
    debtRatio: {
      description: '부채비율은 자기자본 대비 총부채의 비율입니다.',
      criteria: '부채비율 50% 미만: 8~10점, 50~100%: 6~7점, 100~200%: 4~5점, 200% 이상: 1~3점.'
    },
    currentRatio: {
      description: '유동비율은 유동자산을 유동부채로 나눈 비율로 단기 지급능력을 나타냅니다.',
      criteria: '유동비율 200% 이상: 8~10점, 150~200%: 6~7점, 100~150%: 4~5점, 100% 미만: 1~3점.'
    },
    epsGrowth: {
      description: 'EPS 성장률은 주당순이익의 전년 대비 성장률입니다.',
      criteria: 'EPS 성장률 30% 이상: 8~10점, 10~30%: 6~7점, 0~10%: 4~5점, 마이너스: 1~3점.'
    },
    revenueGrowth: {
      description: '매출 성장률은 매출액의 전년 대비 성장률입니다.',
      criteria: '매출 성장률 20% 이상: 8~10점, 10~20%: 6~7점, 0~10%: 4~5점, 마이너스: 1~3점.'
    }
  },
  technical: {
    maPosition: {
      description: '현재 주가와 이동평균선(MA20, MA50, MA120)의 위치 관계입니다.',
      criteria: '정배열: 8~10점, 주가가 단기 이평선 위: 5~7점, 역배열: 1~4점.'
    },
    rsi: {
      description: 'RSI(상대강도지수)는 과매수/과매도 상태를 나타냅니다.',
      criteria: 'RSI 30~50: 7~9점, RSI 50~70: 5~6점, RSI 30 미만: 6~8점, RSI 70 이상: 2~4점.'
    },
    volumeTrend: {
      description: '최근 거래량 변화 추세입니다.',
      criteria: '상승+거래량증가: 8~10점, 상승+거래량감소: 4~6점, 하락+거래량증가: 2~4점.'
    },
    macd: {
      description: 'MACD는 단기/장기 이동평균의 차이로 추세를 파악합니다.',
      criteria: '골든크로스: 8~10점, MACD > 0: 5~7점, MACD < 0: 3~5점, 데드크로스: 1~3점.'
    },
    bollingerBand: {
      description: '볼린저 밴드는 주가의 상대적 위치와 변동성을 나타냅니다.',
      criteria: '하단밴드 근처: 7~9점 (매수 기회), 중간: 5~6점, 상단밴드 근처: 3~5점 (매도 고려).'
    },
    stochastic: {
      description: '스토캐스틱은 일정 기간 내 가격 범위에서 현재가의 위치를 나타냅니다.',
      criteria: '%K 20 이하: 8~9점 (과매도), %K 20~40: 6~7점, %K 40~70: 5점 (중립), %K 70~80: 4점, %K 80 이상: 2~3점 (과매수).'
    },
    adx: {
      description: 'ADX는 추세의 강도를 나타내며, +DI/-DI는 방향을 나타냅니다.',
      criteria: 'ADX 25 이상 + 상승추세: 8~10점, ADX 25 이상 + 하락추세: 2~4점, ADX 25 미만: 4~6점.'
    },
    divergence: {
      description: '다이버전스는 가격과 지표의 괴리로 추세 반전 신호를 감지합니다.',
      criteria: '상승 다이버전스: 8~10점, 없음: 5점, 하락 다이버전스: 1~3점.'
    }
  },
  news: {
    sentiment: {
      description: '최근 뉴스/공시의 긍정/부정 감성 분석 결과입니다.',
      criteria: '긍정적 뉴스 다수: 8~10점, 중립적: 5~6점, 부정적 뉴스 다수: 1~4점.'
    },
    frequency: {
      description: '최근 뉴스와 공시의 발생 빈도입니다.',
      criteria: '일평균 0.5~2건: 7~9점, 2~5건: 5~6점, 5건 이상: 3~5점.'
    },
    disclosureImpact: {
      description: '최근 공시의 유형별 영향도를 분석합니다.',
      criteria: '긍정적 공시(실적, 배당): 8~10점, 중립적: 5~6점, 부정적 공시(유상증자): 1~4점.'
    },
    recency: {
      description: '최근 뉴스의 신선도를 평가합니다.',
      criteria: '24시간 이내 뉴스: 8~10점, 3일 이내: 6~7점, 7일 이내: 4~5점, 7일 이상: 1~3점.'
    }
  },
  supplyDemand: {
    foreignFlow: {
      description: '외국인 투자자의 순매수/순매도 동향입니다.',
      criteria: '연속 순매수 5일 이상: 8~10점, 순매수: 6~7점, 순매도: 3~5점, 연속 순매도: 1~3점.'
    },
    institutionFlow: {
      description: '기관 투자자의 순매수/순매도 동향입니다.',
      criteria: '연속 순매수 5일 이상: 8~10점, 순매수: 6~7점, 순매도: 3~5점, 연속 순매도: 1~3점.'
    }
  }
}

export default function ScoreBreakdown({ scores }: ScoreBreakdownProps) {
  return (
    <div>
      {/* Category averages */}
      <h3 className="font-semibold text-slate-200 mb-3">카테고리별 점수</h3>
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="text-center p-3 bg-slate-800/30 rounded-lg">
          <p className="text-2xl font-bold text-cyan-400">{scores.fundamental.average.toFixed(1)}</p>
          <p className="text-xs text-slate-500">기본적 분석</p>
        </div>
        <div className="text-center p-3 bg-slate-800/30 rounded-lg">
          <p className="text-2xl font-bold text-purple-400">{scores.technical.average.toFixed(1)}</p>
          <p className="text-xs text-slate-500">기술적 분석</p>
        </div>
        <div className="text-center p-3 bg-slate-800/30 rounded-lg">
          <p className="text-2xl font-bold text-blue-400">{scores.news.average.toFixed(1)}</p>
          <p className="text-xs text-slate-500">뉴스/공시</p>
        </div>
        <div className="text-center p-3 bg-slate-800/30 rounded-lg">
          <p className="text-2xl font-bold text-amber-400">{scores.supplyDemand?.average?.toFixed(1) ?? '5.0'}</p>
          <p className="text-xs text-slate-500">수급 분석</p>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-4">
        각 항목의 ▼ 버튼을 클릭하면 평가 기준을 확인할 수 있습니다.
      </p>

      {/* Fundamental */}
      <h4 className="text-xs font-medium text-slate-500 mb-2 uppercase tracking-wider">기본적 분석</h4>
      <ScoreRow
        label="PER (주가수익비율)"
        score={scores.fundamental.per}
        description={scoreDescriptions.fundamental.per.description}
        criteria={scoreDescriptions.fundamental.per.criteria}
      />
      <ScoreRow
        label="PBR (주가순자산비율)"
        score={scores.fundamental.pbr}
        description={scoreDescriptions.fundamental.pbr.description}
        criteria={scoreDescriptions.fundamental.pbr.criteria}
      />
      <ScoreRow
        label="ROE (자기자본이익률)"
        score={scores.fundamental.roe}
        description={scoreDescriptions.fundamental.roe.description}
        criteria={scoreDescriptions.fundamental.roe.criteria}
      />
      <ScoreRow
        label="영업이익률"
        score={scores.fundamental.operatingMargin}
        description={scoreDescriptions.fundamental.operatingMargin.description}
        criteria={scoreDescriptions.fundamental.operatingMargin.criteria}
      />
      <ScoreRow
        label="부채비율"
        score={scores.fundamental.debtRatio}
        description={scoreDescriptions.fundamental.debtRatio.description}
        criteria={scoreDescriptions.fundamental.debtRatio.criteria}
      />
      <ScoreRow
        label="유동비율"
        score={scores.fundamental.currentRatio}
        description={scoreDescriptions.fundamental.currentRatio.description}
        criteria={scoreDescriptions.fundamental.currentRatio.criteria}
      />
      <ScoreRow
        label="EPS 성장률"
        score={scores.fundamental.epsGrowth}
        description={scoreDescriptions.fundamental.epsGrowth.description}
        criteria={scoreDescriptions.fundamental.epsGrowth.criteria}
      />
      <ScoreRow
        label="매출 성장률"
        score={scores.fundamental.revenueGrowth}
        description={scoreDescriptions.fundamental.revenueGrowth.description}
        criteria={scoreDescriptions.fundamental.revenueGrowth.criteria}
      />

      {/* Technical */}
      <h4 className="text-xs font-medium text-slate-500 mb-2 mt-4 uppercase tracking-wider">기술적 분석</h4>
      <ScoreRow
        label="이동평균선 위치"
        score={scores.technical.maPosition}
        description={scoreDescriptions.technical.maPosition.description}
        criteria={scoreDescriptions.technical.maPosition.criteria}
      />
      <ScoreRow
        label="RSI"
        score={scores.technical.rsi}
        description={scoreDescriptions.technical.rsi.description}
        criteria={scoreDescriptions.technical.rsi.criteria}
      />
      <ScoreRow
        label="거래량 추세"
        score={scores.technical.volumeTrend}
        description={scoreDescriptions.technical.volumeTrend.description}
        criteria={scoreDescriptions.technical.volumeTrend.criteria}
      />
      <ScoreRow
        label="MACD"
        score={scores.technical.macd}
        description={scoreDescriptions.technical.macd.description}
        criteria={scoreDescriptions.technical.macd.criteria}
      />
      <ScoreRow
        label="볼린저 밴드"
        score={scores.technical.bollingerBand}
        description={scoreDescriptions.technical.bollingerBand.description}
        criteria={scoreDescriptions.technical.bollingerBand.criteria}
      />
      <ScoreRow
        label="스토캐스틱"
        score={scores.technical.stochastic}
        description={scoreDescriptions.technical.stochastic.description}
        criteria={scoreDescriptions.technical.stochastic.criteria}
      />
      <ScoreRow
        label="ADX (추세 강도)"
        score={scores.technical.adx}
        description={scoreDescriptions.technical.adx.description}
        criteria={scoreDescriptions.technical.adx.criteria}
      />
      <ScoreRow
        label="다이버전스"
        score={scores.technical.divergence}
        description={scoreDescriptions.technical.divergence.description}
        criteria={scoreDescriptions.technical.divergence.criteria}
      />

      {/* News */}
      <h4 className="text-xs font-medium text-slate-500 mb-2 mt-4 uppercase tracking-wider">뉴스/공시 분석</h4>
      <ScoreRow
        label="감성 분석"
        score={scores.news.sentiment}
        description={scoreDescriptions.news.sentiment.description}
        criteria={scoreDescriptions.news.sentiment.criteria}
      />
      <ScoreRow
        label="뉴스/공시 빈도"
        score={scores.news.frequency}
        description={scoreDescriptions.news.frequency.description}
        criteria={scoreDescriptions.news.frequency.criteria}
      />
      <ScoreRow
        label="공시 영향도"
        score={scores.news.disclosureImpact}
        description={scoreDescriptions.news.disclosureImpact.description}
        criteria={scoreDescriptions.news.disclosureImpact.criteria}
      />
      <ScoreRow
        label="뉴스 신선도"
        score={scores.news.recency}
        description={scoreDescriptions.news.recency.description}
        criteria={scoreDescriptions.news.recency.criteria}
      />

      {/* Supply/Demand */}
      <h4 className="text-xs font-medium text-slate-500 mb-2 mt-4 uppercase tracking-wider">수급 분석</h4>
      <ScoreRow
        label="외국인 수급"
        score={scores.supplyDemand?.foreignFlow ?? 5}
        description={scoreDescriptions.supplyDemand.foreignFlow.description}
        criteria={scoreDescriptions.supplyDemand.foreignFlow.criteria}
      />
      <ScoreRow
        label="기관 수급"
        score={scores.supplyDemand?.institutionFlow ?? 5}
        description={scoreDescriptions.supplyDemand.institutionFlow.description}
        criteria={scoreDescriptions.supplyDemand.institutionFlow.criteria}
      />
    </div>
  )
}
