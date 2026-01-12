import {
  Box,
  TextField,
  Typography,
  Divider,
  Button,
  Paper,
  Grid,
  InputAdornment,
} from '@mui/material'
import {
  Search as SearchIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../../store'
import {
  toggleMarket,
  setSearchQuery,
  resetFilters,
} from '../../store/filterSlice'
import type { Market } from '../../types'

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
    stockList.filter(s => s.market === market).length

  const isMarketSelected = (market: Market) =>
    filters.markets.length === 0 || filters.markets.includes(market)

  return (
    <Box>
      {/* 검색 */}
      <TextField
        fullWidth
        size="small"
        placeholder="종목명 또는 코드 검색"
        value={filters.searchQuery}
        onChange={handleSearchChange}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon fontSize="small" color="action" />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />

      <Divider sx={{ my: 2 }} />

      {/* 시장 선택 */}
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        시장 필터
      </Typography>
      <Grid container spacing={1}>
        {MARKETS.map((market) => (
          <Grid item xs={6} key={market.value}>
            <Paper
              variant="outlined"
              sx={{
                p: 1,
                cursor: 'pointer',
                textAlign: 'center',
                bgcolor: isMarketSelected(market.value) ? 'primary.main' : 'transparent',
                color: isMarketSelected(market.value) ? 'white' : 'text.primary',
                borderColor: isMarketSelected(market.value) ? 'primary.main' : 'divider',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: isMarketSelected(market.value) ? 'primary.dark' : 'action.hover',
                },
              }}
              onClick={() => handleMarketChange(market.value)}
            >
              <Typography variant="caption" fontWeight="bold">
                {market.flag} {market.label}
              </Typography>
              <Typography variant="caption" display="block" sx={{ opacity: 0.7 }}>
                {getMarketCount(market.value)}개
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* 초기화 버튼 */}
      <Button
        fullWidth
        variant="outlined"
        size="small"
        onClick={handleReset}
        startIcon={<RefreshIcon />}
      >
        필터 초기화
      </Button>
    </Box>
  )
}
