import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DataGrid, GridColDef, GridRenderCellParams, GridPaginationModel } from '@mui/x-data-grid'
import { Alert, Box, Chip, Typography } from '@mui/material'
import { useAppSelector } from '../../store'
import type { Stock } from '../../types'
import ScoreBadge from '../scoring/ScoreBadge'
import { recalculateScoresWithWeights } from '../../services/scoring/totalScoring'

export default function RankingTable() {
  const navigate = useNavigate()
  const { list, loading, error } = useAppSelector((state) => state.stocks)
  const filters = useAppSelector((state) => state.filters)
  const weights = useAppSelector((state) => state.weights.config)

  // 페이지네이션 상태
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    pageSize: filters.displayCount,
    page: 0,
  })

  // 가중치가 변경되면 점수 재계산
  const stocksWithRecalculatedScores = useMemo(() => {
    return recalculateScoresWithWeights(list, weights)
  }, [list, weights])

  // 필터링 및 정렬된 데이터
  const filteredData = useMemo(() => {
    let result = [...stocksWithRecalculatedScores]

    // 시장 필터
    if (filters.markets.length > 0) {
      result = result.filter((stock) => filters.markets.includes(stock.market))
    }

    // 섹터 필터
    if (filters.sectors.length > 0) {
      result = result.filter((stock) => filters.sectors.includes(stock.sector))
    }

    // 검색어 필터
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      result = result.filter(
        (stock) =>
          stock.name.toLowerCase().includes(query) ||
          stock.symbol.toLowerCase().includes(query)
      )
    }

    // 정렬
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

    // DataGrid가 페이지네이션 처리하므로 slice 제거
    // 순위 추가
    return result.map((stock, index) => ({
      ...stock,
      rank: index + 1,
    }))
  }, [stocksWithRecalculatedScores, filters])

  const columns: GridColDef<Stock & { rank: number }>[] = [
    {
      field: 'rank',
      headerName: '순위',
      width: 70,
      renderCell: (params: GridRenderCellParams) => (
        <Typography fontWeight="bold">{params.row.rank}</Typography>
      ),
    },
    {
      field: 'name',
      headerName: '종목명',
      flex: 1,
      minWidth: 150,
      renderCell: (params: GridRenderCellParams<Stock>) => (
        <Box>
          <Typography variant="body2" fontWeight="medium">
            {params.row.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {params.row.symbol}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'market',
      headerName: '시장',
      width: 100,
      renderCell: (params: GridRenderCellParams<Stock>) => (
        <Chip
          label={params.row.market}
          size="small"
          color={
            params.row.market === 'KOSPI' || params.row.market === 'NYSE'
              ? 'primary'
              : 'secondary'
          }
          variant="outlined"
        />
      ),
    },
    {
      field: 'currentPrice',
      headerName: '현재가',
      width: 120,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<Stock>) => {
        const { currentPrice, currency } = params.row
        return currency === 'KRW'
          ? currentPrice.toLocaleString('ko-KR') + '원'
          : '$' + currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })
      },
    },
    {
      field: 'changePercent',
      headerName: '등락률',
      width: 100,
      align: 'right',
      headerAlign: 'right',
      renderCell: (params: GridRenderCellParams<Stock>) => {
        const value = params.row.changePercent
        return (
          <Typography color={value >= 0 ? 'success.main' : 'error.main'}>
            {value >= 0 ? '+' : ''}
            {value.toFixed(2)}%
          </Typography>
        )
      },
    },
    {
      field: 'totalScore',
      headerName: '종합',
      width: 80,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Stock>) => (
        <ScoreBadge score={params.row.scores.total} size="medium" />
      ),
    },
    {
      field: 'fundamentalScore',
      headerName: '기본',
      width: 70,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Stock>) => (
        <ScoreBadge score={params.row.scores.fundamental.average} size="small" />
      ),
    },
    {
      field: 'technicalScore',
      headerName: '기술',
      width: 70,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Stock>) => (
        <ScoreBadge score={params.row.scores.technical.average} size="small" />
      ),
    },
    {
      field: 'newsScore',
      headerName: '뉴스',
      width: 70,
      align: 'center',
      headerAlign: 'center',
      renderCell: (params: GridRenderCellParams<Stock>) => (
        <ScoreBadge score={params.row.scores.news.average} size="small" />
      ),
    },
  ]

  const handleRowClick = (params: { row: Stock }) => {
    navigate(`/stock/${params.row.symbol}`)
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          데이터 로딩 오류: {error}
        </Alert>
        <Typography variant="body2" color="text.secondary">
          새로고침 버튼을 눌러 다시 시도해주세요.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ height: 700, width: '100%' }}>
      <DataGrid
        rows={filteredData}
        columns={columns}
        getRowId={(row) => row.symbol}
        loading={loading}
        disableRowSelectionOnClick
        onRowClick={handleRowClick}
        pagination
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 20, 50, 100]}
        sx={{
          '& .MuiDataGrid-row': {
            cursor: 'pointer',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: 'action.hover',
          },
        }}
        localeText={{
          noRowsLabel: '데이터가 없습니다. 새로고침을 눌러주세요.',
          MuiTablePagination: {
            labelRowsPerPage: '페이지당 행 수:',
            labelDisplayedRows: ({ from, to, count }) =>
              `${from}-${to} / 총 ${count}개`,
          },
        }}
      />
    </Box>
  )
}
