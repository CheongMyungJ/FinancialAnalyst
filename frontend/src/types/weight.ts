// 가중치 설정
export interface WeightConfig {
  // 기본적 분석 항목별 가중치 (0-100)
  fundamental: {
    per: number
    pbr: number
    roe: number
    operatingMargin: number
  }

  // 기술적 분석 항목별 가중치 (0-100)
  technical: {
    maPosition: number
    rsi: number
    volumeTrend: number
    macd: number
  }

  // 뉴스/공시 분석 항목별 가중치 (0-100)
  news: {
    sentiment: number
    frequency: number
  }

  // 카테고리별 가중치 (0-100)
  category: {
    fundamental: number
    technical: number
    news: number
  }
}

// 기본 가중치 값
export const DEFAULT_WEIGHTS: WeightConfig = {
  fundamental: {
    per: 25,
    pbr: 25,
    roe: 25,
    operatingMargin: 25,
  },
  technical: {
    maPosition: 25,
    rsi: 25,
    volumeTrend: 25,
    macd: 25,
  },
  news: {
    sentiment: 50,
    frequency: 50,
  },
  category: {
    fundamental: 40,
    technical: 40,
    news: 20,
  },
}

// 가중치 프리셋
export interface WeightPreset {
  id: string
  name: string
  description: string
  weights: WeightConfig
}

// 기본 프리셋들
export const DEFAULT_PRESETS: WeightPreset[] = [
  {
    id: 'balanced',
    name: '균형',
    description: '모든 항목에 균등한 가중치',
    weights: DEFAULT_WEIGHTS,
  },
  {
    id: 'value',
    name: '가치 투자',
    description: '기본적 분석에 높은 가중치',
    weights: {
      ...DEFAULT_WEIGHTS,
      category: {
        fundamental: 60,
        technical: 25,
        news: 15,
      },
    },
  },
  {
    id: 'momentum',
    name: '모멘텀',
    description: '기술적 분석에 높은 가중치',
    weights: {
      ...DEFAULT_WEIGHTS,
      category: {
        fundamental: 25,
        technical: 60,
        news: 15,
      },
    },
  },
  {
    id: 'news-driven',
    name: '뉴스 중심',
    description: '뉴스/공시 분석에 높은 가중치',
    weights: {
      ...DEFAULT_WEIGHTS,
      category: {
        fundamental: 30,
        technical: 30,
        news: 40,
      },
    },
  },
]
