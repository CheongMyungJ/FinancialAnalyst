import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Building2, Star, TrendingUp, TrendingDown } from 'lucide-react'
import { useAppSelector } from '../store'
import type { Stock } from '../types'
import ScoreBadge from '../components/scoring/ScoreBadge'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Spinner } from '../components/ui/spinner'
import { cn } from '../lib/utils'

interface SectorStats {
  name: string
  market: string
  stockCount: number
  avgScore: number
  avgFundamental: number
  avgTechnical: number
  avgNews: number
  avgSupplyDemand: number
  avgChangePercent: number
  topStocks: Stock[]
}

export default function SectorAnalysisPage() {
  const navigate = useNavigate()
  const { list, loading } = useAppSelector((state) => state.stocks)

  const sectorStats = useMemo(() => {
    if (list.length === 0) return []

    const getRegion = (market: string) => {
      if (market === 'KOSPI' || market === 'KOSDAQ') return 'KR'
      if (market === 'NYSE' || market === 'NASDAQ') return 'US'
      return market
    }

    const sectorMap = new Map<string, Stock[]>()

    list.forEach((stock) => {
      const region = getRegion(stock.market)
      const key = `${stock.sector}|${region}`
      if (!sectorMap.has(key)) {
        sectorMap.set(key, [])
      }
      sectorMap.get(key)!.push(stock)
    })

    const stats: SectorStats[] = []

    sectorMap.forEach((stocks, key) => {
      const [sector, region] = key.split('|')
      const count = stocks.length

      const avgScore = stocks.reduce((sum, s) => sum + s.scores.total, 0) / count
      const avgFundamental = stocks.reduce((sum, s) => sum + s.scores.fundamental.average, 0) / count
      const avgTechnical = stocks.reduce((sum, s) => sum + s.scores.technical.average, 0) / count
      const avgNews = stocks.reduce((sum, s) => sum + s.scores.news.average, 0) / count
      const avgSupplyDemand = stocks.reduce((sum, s) => sum + (s.scores.supplyDemand?.average ?? 5), 0) / count
      const avgChangePercent = stocks.reduce((sum, s) => sum + s.changePercent, 0) / count

      const topStocks = [...stocks]
        .sort((a, b) => b.scores.total - a.scores.total)
        .slice(0, 3)

      stats.push({
        name: sector,
        market: region,
        stockCount: count,
        avgScore,
        avgFundamental,
        avgTechnical,
        avgNews,
        avgSupplyDemand,
        avgChangePercent,
        topStocks,
      })
    })

    return stats.sort((a, b) => b.avgScore - a.avgScore)
  }, [list])

  const koreanSectors = sectorStats.filter((s) => s.market === 'KR')
  const usSectors = sectorStats.filter((s) => s.market === 'US')

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (list.length === 0) {
    return (
      <Card className="text-center py-12">
        <PieChart className="h-16 w-16 text-slate-600 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-slate-400 mb-2">데이터가 없습니다</h3>
        <p className="text-sm text-slate-500">
          메인 페이지에서 새로고침 버튼을 눌러 데이터를 불러와주세요.
        </p>
      </Card>
    )
  }

  const renderSectorCard = (sector: SectorStats) => (
    <Card
      key={`${sector.name}-${sector.market}`}
      className="hover:border-slate-600 transition-all hover:shadow-lg hover:shadow-cyan-500/5"
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-100 truncate" title={sector.name}>
              {sector.name}
            </h3>
            <div className="flex gap-1.5 mt-1">
              <Badge variant="outline" className="text-xs">
                {sector.market === 'KR' ? '🇰🇷' : '🇺🇸'}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {sector.stockCount}개
              </Badge>
            </div>
          </div>
          <ScoreBadge score={sector.avgScore} size="large" />
        </div>

        {/* Score bars */}
        <div className="space-y-2 mb-3">
          {[
            { label: '기본', value: sector.avgFundamental },
            { label: '기술', value: sector.avgTechnical },
            { label: '뉴스', value: sector.avgNews },
            { label: '수급', value: sector.avgSupplyDemand },
          ].map((item) => (
            <div key={item.label}>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">{item.label}</span>
                <span className="font-medium text-slate-300">{item.value.toFixed(1)}</span>
              </div>
              <Progress value={item.value * 10} max={100} />
            </div>
          ))}
        </div>

        {/* Change percent */}
        <div
          className={cn(
            'flex items-center justify-center gap-1.5 p-2 rounded-lg mb-3',
            sector.avgChangePercent >= 0
              ? 'bg-emerald-500/10 text-emerald-400'
              : 'bg-rose-500/10 text-rose-400'
          )}
        >
          {sector.avgChangePercent >= 0 ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          <span className="font-medium">
            {sector.avgChangePercent >= 0 ? '+' : ''}
            {sector.avgChangePercent.toFixed(2)}%
          </span>
        </div>

        {/* Top stocks */}
        <div>
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
            <Star className="h-3 w-3" />
            TOP 3
          </div>
          <div className="space-y-1">
            {sector.topStocks.map((stock, index) => (
              <button
                key={stock.symbol}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
                className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">{index + 1}</span>
                  <span className="text-sm text-slate-300 truncate max-w-[120px]">
                    {stock.name}
                  </span>
                </div>
                <ScoreBadge score={stock.scores.total} size="small" />
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <PieChart className="h-8 w-8 text-cyan-500" />
          <h1 className="text-2xl font-bold text-slate-50">섹터 분석</h1>
        </div>
        <p className="text-slate-400">
          업종별 평균 점수와 등락률을 비교하고, 각 섹터의 상위 종목을 확인합니다.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <Building2 className="h-6 w-6 text-slate-500 mx-auto mb-1" />
            <p className="text-2xl font-bold text-slate-50">{sectorStats.length}</p>
            <p className="text-xs text-slate-500">전체 섹터</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-2xl mb-1 block">🇰🇷</span>
            <p className="text-2xl font-bold text-slate-50">{koreanSectors.length}</p>
            <p className="text-xs text-slate-500">한국 섹터</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <span className="text-2xl mb-1 block">🇺🇸</span>
            <p className="text-2xl font-bold text-slate-50">{usSectors.length}</p>
            <p className="text-xs text-slate-500">미국 섹터</p>
          </CardContent>
        </Card>
        <Card className="bg-amber-500/10 border-amber-500/30">
          <CardContent className="p-4 text-center">
            <Star className="h-6 w-6 text-amber-500 mx-auto mb-1" />
            <p className="text-lg font-bold text-slate-50 truncate">
              {sectorStats[0]?.name || '-'}
            </p>
            <p className="text-xs text-slate-400">
              최고 점수 ({sectorStats[0]?.avgScore.toFixed(1) || '-'})
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Korean sectors */}
      {koreanSectors.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🇰🇷</span>
            <h2 className="text-lg font-bold text-slate-50">한국 시장</h2>
            <Badge variant="secondary">{koreanSectors.length}개 섹터</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {koreanSectors.map(renderSectorCard)}
          </div>
        </div>
      )}

      {/* US sectors */}
      {usSectors.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">🇺🇸</span>
            <h2 className="text-lg font-bold text-slate-50">미국 시장</h2>
            <Badge variant="secondary">{usSectors.length}개 섹터</Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {usSectors.map(renderSectorCard)}
          </div>
        </div>
      )}
    </div>
  )
}
