// 가중치 설정
export interface WeightConfig {
  // 기본적 분석 항목별 가중치 (0-100)
  fundamental: {
    per: number
    pbr: number
    roe: number
    operatingMargin: number
    debtRatio: number
    currentRatio: number
    epsGrowth: number
    revenueGrowth: number
  }

  // 기술적 분석 항목별 가중치 (0-100)
  technical: {
    maPosition: number
    rsi: number
    volumeTrend: number
    macd: number
    bollingerBand: number
    stochastic: number
    adx: number
    divergence: number
  }

  // 뉴스/공시 분석 항목별 가중치 (0-100)
  news: {
    sentiment: number
    frequency: number
    disclosureImpact: number
    recency: number
  }

  // 수급 분석 항목별 가중치 (0-100)
  supplyDemand: {
    foreignFlow: number
    institutionFlow: number
  }

  // 카테고리별 가중치 (0-100)
  category: {
    fundamental: number
    technical: number
    news: number
    supplyDemand: number
  }
}

// 기본 가중치 값
export const DEFAULT_WEIGHTS: WeightConfig = {
  fundamental: {
    per: 15,
    pbr: 15,
    roe: 15,
    operatingMargin: 15,
    debtRatio: 10,
    currentRatio: 10,
    epsGrowth: 10,
    revenueGrowth: 10,
  },
  technical: {
    maPosition: 15,
    rsi: 15,
    volumeTrend: 10,
    macd: 15,
    bollingerBand: 15,
    stochastic: 10,
    adx: 10,
    divergence: 10,
  },
  news: {
    sentiment: 30,
    frequency: 30,
    disclosureImpact: 20,
    recency: 20,
  },
  supplyDemand: {
    foreignFlow: 50,
    institutionFlow: 50,
  },
  category: {
    fundamental: 35,
    technical: 35,
    news: 15,
    supplyDemand: 15,
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
        fundamental: 50,
        technical: 25,
        news: 15,
        supplyDemand: 10,
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
        fundamental: 20,
        technical: 50,
        news: 15,
        supplyDemand: 15,
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
        fundamental: 25,
        technical: 25,
        news: 35,
        supplyDemand: 15,
      },
    },
  },
  {
    id: 'supply-demand',
    name: '수급 중심',
    description: '외국인/기관 수급에 높은 가중치',
    weights: {
      ...DEFAULT_WEIGHTS,
      category: {
        fundamental: 25,
        technical: 25,
        news: 15,
        supplyDemand: 35,
      },
    },
  },
]
