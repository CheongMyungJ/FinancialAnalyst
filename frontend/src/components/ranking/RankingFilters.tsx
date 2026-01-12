import { Search, RotateCcw } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store'
import { toggleMarket, setSearchQuery, resetFilters } from '../../store/filterSlice'
import type { Market } from '../../types'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

const MARKETS: { value: Market; label: string; flag: string }[] = [
  { value: 'KOSPI', label: 'KOSPI', flag: '🇰🇷' },
  { value: 'KOSDAQ', label: 'KOSDAQ', flag: '🇰🇷' },
  { value: 'NYSE', label: 'NYSE', flag: '🇺🇸' },
  { value: 'NASDAQ', label: 'NASDAQ', flag: '🇺🇸' },
]

export default function RankingFilters() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector((state) => state.filters)
  const stockList = useAppSelector((state) => state.stocks.list)

  const handleMarketChange = (market: Market) => {
    dispatch(toggleMarket(market))
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(event.target.value))
  }

  const handleReset = () => {
    dispatch(resetFilters())
  }

  const getMarketCount = (market: Market) =>
    stockList.filter((s) => s.market === market).length

  const isMarketSelected = (market: Market) =>
    filters.markets.length === 0 || filters.markets.includes(market)

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input
          placeholder="종목명 또는 코드 검색"
          value={filters.searchQuery}
          onChange={handleSearchChange}
          className="pl-9"
        />
      </div>

      <div className="h-px bg-slate-800" />

      {/* Market filter */}
      <div>
        <p className="text-xs text-slate-500 mb-2">시장 필터</p>
        <div className="grid grid-cols-2 gap-2">
          {MARKETS.map((market) => (
            <button
              key={market.value}
              onClick={() => handleMarketChange(market.value)}
              className={cn(
                'p-2.5 rounded-lg border text-center transition-all',
                isMarketSelected(market.value)
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
                  : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-300'
              )}
            >
              <span className="text-sm font-medium">
                {market.flag} {market.label}
              </span>
              <span className="block text-xs opacity-70 mt-0.5">
                {getMarketCount(market.value)}개
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-slate-800" />

      {/* Reset button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleReset}
        className="w-full gap-2"
      >
        <RotateCcw className="h-4 w-4" />
        필터 초기화
      </Button>
    </div>
  )
}
