import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table'
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { useAppSelector } from '../../store'
import type { Stock } from '../../types'
import ScoreBadge from '../scoring/ScoreBadge'
import { recalculateScoresWithWeights } from '../../services/scoring/totalScoring'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Spinner } from '../ui/spinner'
import { cn } from '../../lib/utils'

type StockWithRank = Stock & { rank: number }

export default function RankingTable() {
  const navigate = useNavigate()
  const { list, loading, error } = useAppSelector((state) => state.stocks)
  const filters = useAppSelector((state) => state.filters)
  const weights = useAppSelector((state) => state.weights.config)

  const [pageIndex, setPageIndex] = useState(0)
  const [pageSize, setPageSize] = useState(20)

  const stocksWithRecalculatedScores = useMemo(() => {
    return recalculateScoresWithWeights(list, weights)
  }, [list, weights])

  // 시장/섹터 필터와 정렬을 적용하고 순위를 부여 (검색어 필터 제외)
  const rankedData = useMemo(() => {
    let result = [...stocksWithRecalculatedScores]

    // 시장 필터 적용
    if (filters.markets.length > 0) {
      result = result.filter((stock) => filters.markets.includes(stock.market))
    }

    // 섹터 필터 적용
    if (filters.sectors.length > 0) {
      result = result.filter((stock) => filters.sectors.includes(stock.sector))
    }

    // 정렬 적용
    result.sort((a, b) => {
      let aValue: number | string
      let bValue: number | string

      switch (filters.sortBy) {
        case 'total':
          aValue = a.scores.total
          bValue = b.scores.total
          break
        case 'fundamental':
          aValue = a.scores.fundamental.average
          bValue = b.scores.fundamental.average
          break
        case 'technical':
          aValue = a.scores.technical.average
          bValue = b.scores.technical.average
          break
        case 'news':
          aValue = a.scores.news.average
          bValue = b.scores.news.average
          break
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'changePercent':
          aValue = a.changePercent
          bValue = b.changePercent
          break
        default:
          aValue = a.scores.total
          bValue = b.scores.total
      }

      if (typeof aValue === 'string') {
        return filters.sortOrder === 'asc'
          ? aValue.localeCompare(bValue as string)
          : (bValue as string).localeCompare(aValue)
      }

      return filters.sortOrder === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number)
    })

    // 시장/섹터 필터 기준으로 순위 부여
    return result.map((stock, index) => ({
      ...stock,
      rank: index + 1,
    }))
  }, [stocksWithRecalculatedScores, filters.markets, filters.sectors, filters.sortBy, filters.sortOrder])

  // 검색어 필터 적용 (순위는 유지)
  const filteredData = useMemo(() => {
    if (!filters.searchQuery) {
      return rankedData
    }

    const query = filters.searchQuery.toLowerCase()
    return rankedData.filter(
      (stock) =>
        stock.name.toLowerCase().includes(query) ||
        stock.symbol.toLowerCase().includes(query)
    )
  }, [rankedData, filters.searchQuery])

  const columns: ColumnDef<StockWithRank>[] = [
    {
      accessorKey: 'rank',
      header: '순위',
      cell: ({ row }) => (
        <span className="font-bold text-slate-300">#{row.original.rank}</span>
      ),
      size: 60,
    },
    {
      accessorKey: 'name',
      header: '종목명',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-slate-100">{row.original.name}</p>
          <p className="text-xs text-slate-500">{row.original.symbol}</p>
        </div>
      ),
    },
    {
      accessorKey: 'market',
      header: '시장',
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.market === 'KOSPI' || row.original.market === 'NYSE'
              ? 'default'
              : 'secondary'
          }
        >
          {row.original.market}
        </Badge>
      ),
      size: 90,
    },
    {
      accessorKey: 'currentPrice',
      header: () => <div className="text-right">현재가</div>,
      cell: ({ row }) => {
        const { currentPrice, currency } = row.original
        const formatted =
          currency === 'KRW'
            ? currentPrice.toLocaleString('ko-KR') + '원'
            : '$' + currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })
        return <div className="text-right font-medium">{formatted}</div>
      },
      size: 120,
    },
    {
      accessorKey: 'changePercent',
      header: () => <div className="text-right">등락률</div>,
      cell: ({ row }) => {
        const value = row.original.changePercent
        return (
          <div
            className={cn(
              'text-right font-medium',
              value >= 0 ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            {value >= 0 ? '+' : ''}
            {value.toFixed(2)}%
          </div>
        )
      },
      size: 90,
    },
    {
      accessorKey: 'totalScore',
      header: () => <div className="text-center">종합</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <ScoreBadge score={row.original.scores.total} size="medium" />
        </div>
      ),
      size: 80,
    },
    {
      accessorKey: 'fundamentalScore',
      header: () => <div className="text-center">기본</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <ScoreBadge score={row.original.scores.fundamental.average} size="small" />
        </div>
      ),
      size: 60,
    },
    {
      accessorKey: 'technicalScore',
      header: () => <div className="text-center">기술</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <ScoreBadge score={row.original.scores.technical.average} size="small" />
        </div>
      ),
      size: 60,
    },
    {
      accessorKey: 'newsScore',
      header: () => <div className="text-center">뉴스</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <ScoreBadge score={row.original.scores.news.average} size="small" />
        </div>
      ),
      size: 60,
    },
    {
      accessorKey: 'supplyDemandScore',
      header: () => <div className="text-center">수급</div>,
      cell: ({ row }) => (
        <div className="flex justify-center">
          <ScoreBadge score={row.original.scores.supplyDemand?.average ?? 5} size="small" />
        </div>
      ),
      size: 60,
    },
  ]

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newState = updater({ pageIndex, pageSize })
        setPageIndex(newState.pageIndex)
        setPageSize(newState.pageSize)
      }
    },
  })

  if (error) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-2 text-rose-400 mb-2">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">데이터 로딩 오류: {error}</span>
        </div>
        <p className="text-sm text-slate-500">
          새로고침 버튼을 눌러 다시 시도해주세요.
        </p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-slate-400">데이터 로딩중...</p>
        </div>
      </div>
    )
  }

  if (filteredData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-500">
        데이터가 없습니다. 새로고침을 눌러주세요.
      </div>
    )
  }

  return (
    <div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-slate-800">
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                    style={{ width: header.getSize() }}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => navigate(`/stock/${row.original.symbol}`)}
                className="border-b border-slate-800/50 hover:bg-slate-800/50 cursor-pointer transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">페이지당</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value))
              setPageIndex(0)
            }}
            className="bg-slate-800 border border-slate-700 rounded-md px-2 py-1 text-sm text-slate-300"
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span className="text-sm text-slate-400">개</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400">
            {pageIndex * pageSize + 1}-{Math.min((pageIndex + 1) * pageSize, filteredData.length)} / 총{' '}
            {filteredData.length}개
          </span>
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
              disabled={pageIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPageIndex((p) => p + 1)}
              disabled={(pageIndex + 1) * pageSize >= filteredData.length}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
