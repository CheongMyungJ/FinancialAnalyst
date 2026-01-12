import { useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Building2,
  Newspaper,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Star,
  LineChart,
  Landmark,
  Gauge,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../store'
import { fetchStockDetail, clearSelectedStock } from '../store/stockSlice'
import ScoreBreakdown from '../components/scoring/ScoreBreakdown'
import PriceChart from '../components/charts/PriceChart'
import VolumeChart from '../components/charts/VolumeChart'
import ScoreRadarChart from '../components/charts/ScoreRadarChart'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Spinner } from '../components/ui/spinner'
import { cn } from '../lib/utils'
import type { PriceData } from '../types'

// 이동평균 계산
function calculateMA(prices: PriceData[], period: number): (number | undefined)[] {
  return prices.map((_, i) => {
    if (i < period - 1) return undefined
    const slice = prices.slice(i - period + 1, i + 1)
    return slice.reduce((sum, p) => sum + p.close, 0) / period
  })
}

// 섹터별 기업 설명
const SECTOR_DESCRIPTIONS: Record<string, string> = {
  // 한국 섹터
  '전기전자': '반도체, 디스플레이, 전자부품, 가전제품 등을 제조하는 기업입니다.',
  '서비스업': 'IT 서비스, 플랫폼, 게임, 통신 등 서비스를 제공하는 기업입니다.',
  '운수장비': '자동차, 자동차 부품, 조선 등 운송장비를 제조하는 기업입니다.',
  '화학': '석유화학, 정밀화학, 화장품 등 화학제품을 제조하는 기업입니다.',
  '철강금속': '철강, 비철금속, 금속가공 제품을 제조하는 기업입니다.',
  '은행': '예금, 대출, 금융 서비스를 제공하는 금융기관입니다.',
  '보험': '생명보험, 손해보험 등 보험 서비스를 제공하는 기업입니다.',
  '증권': '주식, 채권 거래 및 자산관리 서비스를 제공하는 금융기관입니다.',
  '건설업': '건축, 토목, 플랜트 등 건설 사업을 영위하는 기업입니다.',
  '의약품': '의약품, 바이오 제품을 연구개발 및 제조하는 기업입니다.',
  '식품': '식품, 음료를 제조 및 판매하는 기업입니다.',
  '유통업': '백화점, 마트, 편의점 등 유통 사업을 영위하는 기업입니다.',
  '기계': '산업기계, 정밀기기 등을 제조하는 기업입니다.',
  '전기가스': '전력, 가스 등 에너지를 생산 및 공급하는 기업입니다.',
  '금융': '종합금융 서비스를 제공하는 기업입니다.',
  // 미국 섹터
  'Technology': 'Develops and sells technology products including software, hardware, and IT services.',
  'Consumer Cyclical': 'Sells discretionary goods and services that consumers buy when they have extra income.',
  'Financial Services': 'Provides financial services including banking, insurance, and investment management.',
  'Healthcare': 'Develops pharmaceuticals, medical devices, and provides healthcare services.',
  'Communication Services': 'Provides communication and media services including telecom and entertainment.',
  'Consumer Defensive': 'Produces essential goods that consumers need regardless of economic conditions.',
  'Industrials': 'Manufactures industrial goods, machinery, and provides industrial services.',
  'Energy': 'Explores, produces, and refines oil, gas, and renewable energy.',
  'Materials': 'Produces raw materials including chemicals, metals, and construction materials.',
  'Utilities': 'Provides essential utility services including electricity, water, and gas.',
  'Real Estate': 'Owns, develops, and manages real estate properties.',
}

// 뉴스 검색 링크 생성
function getNewsLinks(name: string, symbol: string, market: string) {
  const isKorean = market === 'KOSPI' || market === 'KOSDAQ'
  const searchName = encodeURIComponent(name)
  const searchSymbol = encodeURIComponent(symbol)

  if (isKorean) {
    return [
      { name: '네이버 뉴스', url: `https://search.naver.com/search.naver?where=news&query=${searchName}` },
      { name: '네이버 금융', url: `https://finance.naver.com/item/main.naver?code=${symbol}` },
      { name: '다음 뉴스', url: `https://search.daum.net/search?w=news&q=${searchName}` },
      { name: 'Google 뉴스', url: `https://news.google.com/search?q=${searchName}&hl=ko&gl=KR` },
    ]
  } else {
    return [
      { name: 'Yahoo Finance', url: `https://finance.yahoo.com/quote/${searchSymbol}` },
      { name: 'Google News', url: `https://news.google.com/search?q=${searchName}&hl=en&gl=US` },
      { name: 'MarketWatch', url: `https://www.marketwatch.com/investing/stock/${searchSymbol.toLowerCase()}` },
      { name: 'Seeking Alpha', url: `https://seekingalpha.com/symbol/${searchSymbol}` },
    ]
  }
}

export default function StockDetailPage() {
  const { symbol } = useParams<{ symbol: string }>()
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { selectedStock, selectedStockPriceHistory, loading, error } = useAppSelector(
    (state) => state.stocks
  )

  // 종목 변경 시 이전 데이터 초기화 후 새 데이터 로드
  useEffect(() => {
    dispatch(clearSelectedStock())
    if (symbol) {
      dispatch(fetchStockDetail(symbol))
    }
  }, [dispatch, symbol])

  // 이동평균이 추가된 가격 데이터
  const priceHistory = useMemo(() => {
    if (selectedStockPriceHistory.length === 0) return []

    const ma20Values = calculateMA(selectedStockPriceHistory, 20)
    const ma50Values = calculateMA(selectedStockPriceHistory, 50)

    return selectedStockPriceHistory.map((p, i) => ({
      ...p,
      ma20: ma20Values[i],
      ma50: ma50Values[i],
    }))
  }, [selectedStockPriceHistory])

  const chartLoading = loading && selectedStockPriceHistory.length === 0

  // 에러가 있으면 에러 표시
  if (error) {
    return (
      <div>
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          뒤로가기
        </button>
        <div className="bg-rose-500/10 border border-rose-500/50 rounded-lg p-4 text-rose-400">
          {error}
        </div>
      </div>
    )
  }

  // 현재 URL의 symbol과 로드된 데이터의 symbol이 다르면 로딩 표시
  const isWrongStock = selectedStock && selectedStock.symbol !== symbol
  const showLoading = loading || isWrongStock || !selectedStock

  if (showLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  const { name, market, sector, currentPrice, change, changePercent, currency, scores } =
    selectedStock

  // 기업 설명 및 뉴스 링크
  const sectorDescription = SECTOR_DESCRIPTIONS[sector] || `${sector} 섹터에 속한 기업입니다.`
  const newsLinks = getNewsLinks(name, symbol || '', market)

  const formatPrice = (price: number) => {
    return currency === 'KRW'
      ? price.toLocaleString('ko-KR') + '원'
      : '$' + price.toLocaleString('en-US', { minimumFractionDigits: 2 })
  }

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-slate-200 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        뒤로가기
      </button>

      {/* 종목 헤더 */}
      <div className="rounded-xl p-6 mb-6 bg-gradient-to-r from-purple-600/80 to-cyan-600/80 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <h1 className="text-2xl font-bold text-white">{name}</h1>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            {symbol}
          </Badge>
          <Badge variant="secondary" className="bg-white/30 text-white border-0 font-bold">
            {market}
          </Badge>
          <Badge variant="secondary" className="bg-white/20 text-white border-0">
            {sector}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <p className="text-sm text-white/70 mb-1">현재가</p>
            <p className="text-3xl font-bold text-white">{formatPrice(currentPrice)}</p>
            <div
              className={cn(
                'inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full',
                change >= 0 ? 'bg-emerald-500/30' : 'bg-rose-500/30'
              )}
            >
              {change >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span className="font-bold">
                {change >= 0 ? '+' : ''}{formatPrice(change)} ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div>
            <p className="text-sm text-white/70 mb-1">종합 점수</p>
            <div className="flex items-baseline gap-2">
              <Star className="h-8 w-8 text-amber-400" />
              <span className="text-5xl font-bold text-white">{scores.total.toFixed(1)}</span>
              <span className="text-xl text-white/60">/ 10</span>
            </div>
          </div>

          <div>
            <p className="text-sm text-white/70 mb-2">카테고리별 점수</p>
            <div className="space-y-2">
              {[
                { label: '기본', value: scores.fundamental.average },
                { label: '기술', value: scores.technical.average },
                { label: '뉴스', value: scores.news.average },
                { label: '수급', value: scores.supplyDemand?.average ?? 5 },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-white/80">{item.label}</span>
                    <span className="font-bold text-white">{item.value.toFixed(1)}</span>
                  </div>
                  <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all"
                      style={{ width: `${item.value * 10}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <Card className="hover:shadow-lg hover:shadow-cyan-500/5 transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <LineChart className="h-5 w-5 text-cyan-400" />
                가격 차트
              </CardTitle>
            </CardHeader>
            <CardContent>
              {chartLoading ? (
                <div className="flex flex-col items-center justify-center h-[400px]">
                  <Spinner size="lg" />
                  <p className="mt-4 text-slate-500">차트 데이터 로딩중...</p>
                </div>
              ) : priceHistory.length === 0 ? (
                <div className="flex items-center justify-center h-[400px]">
                  <p className="text-slate-500">차트 데이터가 없습니다</p>
                </div>
              ) : (
                <>
                  <PriceChart data={priceHistory} currency={currency} />
                  <div className="border-t border-slate-800 my-4" />
                  <VolumeChart data={priceHistory} />
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card className="h-full hover:shadow-lg hover:shadow-cyan-500/5 transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Gauge className="h-5 w-5 text-cyan-400" />
                점수 분포
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScoreRadarChart scores={scores} />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 점수 상세 및 재무 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card className="hover:shadow-lg hover:shadow-cyan-500/5 transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Star className="h-5 w-5 text-amber-400" />
              점수 상세
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScoreBreakdown scores={scores} />
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:shadow-cyan-500/5 transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Landmark className="h-5 w-5 text-cyan-400" />
              재무 지표
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[
                { label: 'PER', value: selectedStock.fundamentals.per?.toFixed(2) || 'N/A' },
                { label: 'PBR', value: selectedStock.fundamentals.pbr?.toFixed(2) || 'N/A' },
                { label: 'ROE', value: selectedStock.fundamentals.roe ? `${selectedStock.fundamentals.roe.toFixed(2)}%` : 'N/A' },
                { label: '영업이익률', value: selectedStock.fundamentals.operatingMargin ? `${selectedStock.fundamentals.operatingMargin.toFixed(2)}%` : 'N/A' },
                { label: '부채비율', value: selectedStock.fundamentals.debtRatio ? `${selectedStock.fundamentals.debtRatio.toFixed(1)}%` : 'N/A' },
                { label: '유동비율', value: selectedStock.fundamentals.currentRatio ? `${selectedStock.fundamentals.currentRatio.toFixed(1)}%` : 'N/A' },
                { label: 'EPS 성장률', value: selectedStock.fundamentals.epsGrowth ? `${selectedStock.fundamentals.epsGrowth > 0 ? '+' : ''}${selectedStock.fundamentals.epsGrowth.toFixed(1)}%` : 'N/A', positive: selectedStock.fundamentals.epsGrowth && selectedStock.fundamentals.epsGrowth > 0 },
                { label: '매출 성장률', value: selectedStock.fundamentals.revenueGrowth ? `${selectedStock.fundamentals.revenueGrowth > 0 ? '+' : ''}${selectedStock.fundamentals.revenueGrowth.toFixed(1)}%` : 'N/A', positive: selectedStock.fundamentals.revenueGrowth && selectedStock.fundamentals.revenueGrowth > 0 },
              ].map((item) => (
                <div key={item.label} className="bg-slate-800/50 rounded-lg p-3">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className={cn(
                    'text-lg font-bold',
                    'positive' in item ? (item.positive ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-200'
                  )}>{item.value}</p>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-800 my-4" />

            <div className="flex items-center gap-2 mb-3">
              <LineChart className="h-4 w-4 text-purple-400" />
              <h4 className="font-medium text-slate-200">기술적 지표</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500">RSI</p>
                <p
                  className={cn(
                    'text-lg font-bold',
                    selectedStock.technicals.rsi
                      ? selectedStock.technicals.rsi > 70
                        ? 'text-rose-400'
                        : selectedStock.technicals.rsi < 30
                        ? 'text-emerald-400'
                        : 'text-slate-200'
                      : 'text-slate-200'
                  )}
                >
                  {selectedStock.technicals.rsi?.toFixed(1) || 'N/A'}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500">스토캐스틱 %K</p>
                <p
                  className={cn(
                    'text-lg font-bold',
                    selectedStock.technicals.stochasticK
                      ? selectedStock.technicals.stochasticK > 80
                        ? 'text-rose-400'
                        : selectedStock.technicals.stochasticK < 20
                        ? 'text-emerald-400'
                        : 'text-slate-200'
                      : 'text-slate-200'
                  )}
                >
                  {selectedStock.technicals.stochasticK?.toFixed(1) || 'N/A'}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500">ADX (추세강도)</p>
                <p
                  className={cn(
                    'text-lg font-bold',
                    selectedStock.technicals.adx
                      ? selectedStock.technicals.adx > 25
                        ? 'text-cyan-400'
                        : 'text-slate-200'
                      : 'text-slate-200'
                  )}
                >
                  {selectedStock.technicals.adx?.toFixed(1) || 'N/A'}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500">거래량 변화</p>
                <p
                  className={cn(
                    'text-lg font-bold',
                    selectedStock.technicals.volumeChange
                      ? selectedStock.technicals.volumeChange > 0
                        ? 'text-emerald-400'
                        : 'text-rose-400'
                      : 'text-slate-200'
                  )}
                >
                  {selectedStock.technicals.volumeChange
                    ? `${selectedStock.technicals.volumeChange > 0 ? '+' : ''}${selectedStock.technicals.volumeChange.toFixed(1)}%`
                    : 'N/A'}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500">볼린저 밴드 %B</p>
                <p className="text-lg font-bold text-slate-200">
                  {selectedStock.technicals.bollingerPercentB?.toFixed(2) || 'N/A'}
                </p>
              </div>
              <div className="bg-slate-800/50 rounded-lg p-3">
                <p className="text-xs text-slate-500">다이버전스</p>
                <p
                  className={cn(
                    'text-lg font-bold',
                    selectedStock.technicals.rsiDivergence === 'bullish' || selectedStock.technicals.macdDivergence === 'bullish'
                      ? 'text-emerald-400'
                      : selectedStock.technicals.rsiDivergence === 'bearish' || selectedStock.technicals.macdDivergence === 'bearish'
                      ? 'text-rose-400'
                      : 'text-slate-200'
                  )}
                >
                  {selectedStock.technicals.rsiDivergence === 'bullish' || selectedStock.technicals.macdDivergence === 'bullish'
                    ? '상승'
                    : selectedStock.technicals.rsiDivergence === 'bearish' || selectedStock.technicals.macdDivergence === 'bearish'
                    ? '하락'
                    : '없음'}
                </p>
              </div>
            </div>

            {/* 수급 현황 */}
            {selectedStock.supplyDemand && (
              <>
                <div className="border-t border-slate-800 my-4" />
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-4 w-4 text-amber-400" />
                  <h4 className="font-medium text-slate-200">수급 현황</h4>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">외국인 순매수</p>
                    <p
                      className={cn(
                        'text-lg font-bold',
                        selectedStock.supplyDemand.foreignNetBuy
                          ? selectedStock.supplyDemand.foreignNetBuy > 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                          : 'text-slate-200'
                      )}
                    >
                      {selectedStock.supplyDemand.foreignNetBuy
                        ? `${selectedStock.supplyDemand.foreignNetBuy > 0 ? '+' : ''}${selectedStock.supplyDemand.foreignNetBuy.toLocaleString()}억`
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">기관 순매수</p>
                    <p
                      className={cn(
                        'text-lg font-bold',
                        selectedStock.supplyDemand.institutionNetBuy
                          ? selectedStock.supplyDemand.institutionNetBuy > 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                          : 'text-slate-200'
                      )}
                    >
                      {selectedStock.supplyDemand.institutionNetBuy
                        ? `${selectedStock.supplyDemand.institutionNetBuy > 0 ? '+' : ''}${selectedStock.supplyDemand.institutionNetBuy.toLocaleString()}억`
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">외국인 연속</p>
                    <p
                      className={cn(
                        'text-lg font-bold',
                        selectedStock.supplyDemand.foreignNetBuyDays
                          ? selectedStock.supplyDemand.foreignNetBuyDays > 0
                            ? 'text-emerald-400'
                            : 'text-rose-400'
                          : 'text-slate-200'
                      )}
                    >
                      {selectedStock.supplyDemand.foreignNetBuyDays
                        ? `${Math.abs(selectedStock.supplyDemand.foreignNetBuyDays)}일 ${selectedStock.supplyDemand.foreignNetBuyDays > 0 ? '순매수' : '순매도'}`
                        : 'N/A'}
                    </p>
                  </div>
                  <div className="bg-slate-800/50 rounded-lg p-3">
                    <p className="text-xs text-slate-500">외국인 지분율</p>
                    <p className="text-lg font-bold text-slate-200">
                      {selectedStock.supplyDemand.foreignOwnership
                        ? `${selectedStock.supplyDemand.foreignOwnership.toFixed(1)}%`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 기업 정보 및 뉴스 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 기업 정보 */}
        <Card className="hover:shadow-lg hover:shadow-cyan-500/5 transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="h-5 w-5 text-cyan-400" />
              기업 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: '종목코드', value: symbol },
                { label: '시장', value: market },
                { label: '섹터', value: sector },
              ].map((item) => (
                <div key={item.label} className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="font-bold text-slate-200 truncate">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="bg-cyan-500/10 border-l-4 border-cyan-500 rounded-r-lg p-3">
              <p className="text-sm font-bold text-cyan-400 mb-1">업종 설명</p>
              <p className="text-sm text-slate-400">{sectorDescription}</p>
            </div>
          </CardContent>
        </Card>

        {/* 관련 뉴스 링크 */}
        <Card className="hover:shadow-lg hover:shadow-cyan-500/5 transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Newspaper className="h-5 w-5 text-cyan-400" />
              관련 뉴스 및 정보
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {newsLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 hover:bg-cyan-500 hover:text-white transition-all group"
                >
                  <ExternalLink className="h-4 w-4 text-slate-500 group-hover:text-white transition-colors" />
                  <div className="flex-1">
                    <p className="font-medium text-slate-200 group-hover:text-white transition-colors">
                      {link.name}
                    </p>
                    <p className="text-xs text-slate-500 group-hover:text-white/70 transition-colors">
                      {name} 관련 뉴스 보기
                    </p>
                  </div>
                </a>
              ))}
            </div>

            <p className="text-xs text-slate-600 mt-4">
              * 외부 사이트로 연결됩니다
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
