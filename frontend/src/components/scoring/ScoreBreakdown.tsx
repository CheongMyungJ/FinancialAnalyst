import { Box, Typography, LinearProgress, Grid, Tooltip, IconButton, Collapse } from '@mui/material'
import { Info as InfoIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import { useState } from 'react'
import type { StockScores } from '../../types'

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
  const percentage = (score / maxScore) * 100

  // 점수에 따른 색상
  const getColor = (s: number) => {
    if (s >= 8) return 'success'
    if (s >= 6) return 'primary'
    if (s >= 4) return 'warning'
    return 'error'
  }

  // 점수에 따른 평가
  const getEvaluation = (s: number) => {
    if (s >= 8) return '매우 좋음'
    if (s >= 6) return '좋음'
    if (s >= 4) return '보통'
    return '주의 필요'
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.5}>
        <Box display="flex" alignItems="center" gap={0.5}>
          <Typography variant="body2">{label}</Typography>
          <Tooltip title={description} arrow placement="top">
            <InfoIcon sx={{ fontSize: 14, color: 'text.secondary', cursor: 'help' }} />
          </Tooltip>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Typography variant="caption" color="text.secondary">
            {getEvaluation(score)}
          </Typography>
          <Typography variant="body2" fontWeight="bold">
            {score.toFixed(1)}
          </Typography>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              p: 0.25
            }}
          >
            <ExpandMoreIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>
      </Box>
      <LinearProgress
        variant="determinate"
        value={percentage}
        color={getColor(score) as 'success' | 'primary' | 'warning' | 'error'}
        sx={{ height: 8, borderRadius: 4 }}
      />
      <Collapse in={expanded}>
        <Box sx={{ mt: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary" component="div">
            <strong>평가 기준:</strong> {criteria}
          </Typography>
        </Box>
      </Collapse>
    </Box>
  )
}

// 점수 산출 기준 설명
const scoreDescriptions = {
  fundamental: {
    per: {
      description: 'PER(주가수익비율)은 주가를 주당순이익으로 나눈 값입니다.',
      criteria: 'PER 10 이하: 8~10점 (저평가), PER 10~20: 5~7점 (적정), PER 20 이상: 1~4점 (고평가). 업종 평균 대비 낮을수록 높은 점수를 부여합니다.'
    },
    pbr: {
      description: 'PBR(주가순자산비율)은 주가를 주당순자산으로 나눈 값입니다.',
      criteria: 'PBR 1 미만: 8~10점 (자산가치 대비 저평가), PBR 1~3: 5~7점 (적정), PBR 3 이상: 1~4점 (고평가).'
    },
    roe: {
      description: 'ROE(자기자본이익률)는 자기자본 대비 얼마나 이익을 냈는지 나타냅니다.',
      criteria: 'ROE 15% 이상: 8~10점 (높은 수익성), ROE 10~15%: 6~7점 (양호), ROE 5~10%: 4~5점 (보통), ROE 5% 미만: 1~3점 (저조).'
    },
    operatingMargin: {
      description: '영업이익률은 매출액 대비 영업이익의 비율입니다.',
      criteria: '영업이익률 20% 이상: 8~10점 (우수), 10~20%: 5~7점 (양호), 5~10%: 3~5점 (보통), 5% 미만: 1~3점 (저조).'
    }
  },
  technical: {
    maPosition: {
      description: '현재 주가와 이동평균선(MA20, MA50, MA120)의 위치 관계입니다.',
      criteria: '정배열(주가 > MA20 > MA50 > MA120): 8~10점, 주가가 단기 이평선 위: 5~7점, 역배열: 1~4점.'
    },
    rsi: {
      description: 'RSI(상대강도지수)는 과매수/과매도 상태를 나타냅니다.',
      criteria: 'RSI 30~50 (매수 기회): 7~9점, RSI 50~70 (중립): 5~6점, RSI 30 미만 (과매도): 6~8점, RSI 70 이상 (과매수): 2~4점.'
    },
    volumeTrend: {
      description: '최근 거래량 변화 추세입니다.',
      criteria: '주가 상승 + 거래량 증가: 8~10점 (강한 상승세), 주가 상승 + 거래량 감소: 4~6점 (약한 상승), 주가 하락 + 거래량 증가: 2~4점 (매도세).'
    },
    macd: {
      description: 'MACD는 단기/장기 이동평균의 차이로 추세를 파악합니다.',
      criteria: 'MACD 골든크로스 + 히스토그램 양수: 8~10점, MACD > 0: 5~7점, MACD < 0: 3~5점, 데드크로스: 1~3점.'
    }
  },
  news: {
    sentiment: {
      description: '최근 뉴스/공시의 긍정/부정 감성 분석 결과입니다.',
      criteria: '긍정적 뉴스 다수: 8~10점, 중립적: 5~6점, 부정적 뉴스 다수: 1~4점. (현재 샘플 데이터 사용)'
    },
    frequency: {
      description: '최근 뉴스와 공시의 발생 빈도입니다.',
      criteria: '일평균 0.5~2건: 7~9점 (적정한 관심), 2~5건: 5~6점, 5건 이상: 3~5점 (과열/이슈), 거의 없음: 4~6점. (현재 샘플 데이터 사용)'
    }
  }
}

export default function ScoreBreakdown({ scores }: ScoreBreakdownProps) {
  return (
    <Box>
      {/* 카테고리별 평균 점수 */}
      <Typography variant="subtitle1" gutterBottom fontWeight="bold">
        카테고리별 점수
      </Typography>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={4}>
          <Box textAlign="center">
            <Typography variant="h4" color="primary">
              {scores.fundamental.average.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              기본적 분석
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box textAlign="center">
            <Typography variant="h4" color="secondary">
              {scores.technical.average.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              기술적 분석
            </Typography>
          </Box>
        </Grid>
        <Grid item xs={4}>
          <Box textAlign="center">
            <Typography variant="h4" color="info.main">
              {scores.news.average.toFixed(1)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              뉴스/공시
            </Typography>
          </Box>
        </Grid>
      </Grid>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
        각 항목의 ▼ 버튼을 클릭하면 평가 기준을 확인할 수 있습니다.
      </Typography>

      {/* 기본적 분석 상세 */}
      <Typography variant="subtitle2" gutterBottom color="text.secondary">
        기본적 분석
      </Typography>
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

      {/* 기술적 분석 상세 */}
      <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ mt: 2 }}>
        기술적 분석
      </Typography>
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

      {/* 뉴스/공시 상세 */}
      <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ mt: 2 }}>
        뉴스/공시 분석
      </Typography>
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
    </Box>
  )
}
