import {
  Box,
  FormControl,
  FormGroup,
  FormControlLabel,
  Checkbox,
  TextField,
  Select,
  MenuItem,
  InputLabel,
  Typography,
  Divider,
  Button,
} from '@mui/material'
import { useAppDispatch, useAppSelector } from '../../store'
import {
  toggleMarket,
  setDisplayCount,
  setSearchQuery,
  resetFilters,
} from '../../store/filterSlice'
import type { Market, DisplayCount } from '../../types'

const MARKETS: { value: Market; label: string }[] = [
  { value: 'KOSPI', label: 'KOSPI' },
  { value: 'KOSDAQ', label: 'KOSDAQ' },
  { value: 'NYSE', label: 'NYSE' },
  { value: 'NASDAQ', label: 'NASDAQ' },
]

const DISPLAY_COUNTS: DisplayCount[] = [10, 20, 50, 100]

export default function RankingFilters() {
  const dispatch = useAppDispatch()
  const filters = useAppSelector((state) => state.filters)

  const handleMarketChange = (market: Market) => {
    dispatch(toggleMarket(market))
  }

  const handleDisplayCountChange = (count: DisplayCount) => {
    dispatch(setDisplayCount(count))
  }

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setSearchQuery(event.target.value))
  }

  const handleReset = () => {
    dispatch(resetFilters())
  }

  return (
    <Box>
      {/* 검색 */}
      <TextField
        fullWidth
        size="small"
        label="종목 검색"
        placeholder="종목명 또는 코드"
        value={filters.searchQuery}
        onChange={handleSearchChange}
        sx={{ mb: 2 }}
      />

      <Divider sx={{ my: 2 }} />

      {/* 시장 선택 */}
      <Typography variant="subtitle2" gutterBottom>
        시장
      </Typography>
      <FormGroup>
        {MARKETS.map((market) => (
          <FormControlLabel
            key={market.value}
            control={
              <Checkbox
                checked={filters.markets.includes(market.value)}
                onChange={() => handleMarketChange(market.value)}
                size="small"
              />
            }
            label={market.label}
          />
        ))}
      </FormGroup>

      <Divider sx={{ my: 2 }} />

      {/* 표시 개수 */}
      <FormControl fullWidth size="small">
        <InputLabel>표시 개수</InputLabel>
        <Select
          value={filters.displayCount}
          label="표시 개수"
          onChange={(e) => handleDisplayCountChange(e.target.value as DisplayCount)}
        >
          {DISPLAY_COUNTS.map((count) => (
            <MenuItem key={count} value={count}>
              상위 {count}개
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider sx={{ my: 2 }} />

      {/* 초기화 버튼 */}
      <Button fullWidth variant="outlined" onClick={handleReset}>
        필터 초기화
      </Button>
    </Box>
  )
}
