import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { FilterState, Market, DisplayCount, SortBy, SortOrder } from '../types'
import { DEFAULT_FILTER } from '../types'

const initialState: FilterState = DEFAULT_FILTER

const filterSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    // 시장 필터 설정
    setMarkets: (state, action: PayloadAction<Market[]>) => {
      state.markets = action.payload
    },

    // 시장 토글
    toggleMarket: (state, action: PayloadAction<Market>) => {
      const market = action.payload
      const index = state.markets.indexOf(market)
      if (index === -1) {
        state.markets.push(market)
      } else if (state.markets.length > 1) {
        // 최소 1개는 선택 유지
        state.markets.splice(index, 1)
      }
    },

    // 섹터 필터 설정
    setSectors: (state, action: PayloadAction<string[]>) => {
      state.sectors = action.payload
    },

    // 섹터 토글
    toggleSector: (state, action: PayloadAction<string>) => {
      const sector = action.payload
      const index = state.sectors.indexOf(sector)
      if (index === -1) {
        state.sectors.push(sector)
      } else {
        state.sectors.splice(index, 1)
      }
    },

    // 표시 개수 설정
    setDisplayCount: (state, action: PayloadAction<DisplayCount>) => {
      state.displayCount = action.payload
    },

    // 정렬 기준 설정
    setSortBy: (state, action: PayloadAction<SortBy>) => {
      state.sortBy = action.payload
    },

    // 정렬 순서 설정
    setSortOrder: (state, action: PayloadAction<SortOrder>) => {
      state.sortOrder = action.payload
    },

    // 정렬 토글 (같은 기준 클릭 시 순서 변경)
    toggleSort: (state, action: PayloadAction<SortBy>) => {
      if (state.sortBy === action.payload) {
        state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc'
      } else {
        state.sortBy = action.payload
        state.sortOrder = 'desc'
      }
    },

    // 검색어 설정
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload
    },

    // 필터 초기화
    resetFilters: () => initialState,
  },
})

export const {
  setMarkets,
  toggleMarket,
  setSectors,
  toggleSector,
  setDisplayCount,
  setSortBy,
  setSortOrder,
  toggleSort,
  setSearchQuery,
  resetFilters,
} = filterSlice.actions

export default filterSlice.reducer
