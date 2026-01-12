import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import type { Stock, StockListItem, PriceData } from '../types'
import { ALL_STOCKS } from '../data/stockList'
import {
  fetchStocksFromGitHub,
  fetchStockDetailFromGitHub,
} from '../services/api/githubApi'

// 주식 상태
interface StockState {
  list: Stock[]
  loading: boolean
  error: string | null
  lastUpdated: string | null
  selectedStock: Stock | null
  selectedStockPriceHistory: PriceData[]
  stockList: StockListItem[]
  isAnalyzing: boolean
}

const initialState: StockState = {
  list: [],
  loading: false,
  error: null,
  lastUpdated: null,
  selectedStock: null,
  selectedStockPriceHistory: [],
  stockList: ALL_STOCKS,
  isAnalyzing: false,
}

// 주식 데이터 가져오기 (GitHub에서)
export const refreshStocks = createAsyncThunk(
  'stocks/refresh',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchStocksFromGitHub()
      return response
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : '데이터를 가져오는데 실패했습니다.'
      )
    }
  }
)

// 특정 종목 상세 데이터 조회
export const fetchStockDetail = createAsyncThunk(
  'stocks/fetchDetail',
  async (symbol: string, { getState, rejectWithValue }) => {
    try {
      // 이미 로드된 데이터 가져오기
      const state = getState() as { stocks: StockState }
      const allStocks = state.stocks.list

      // GitHub 데이터에서 종목 찾기 + Yahoo Finance에서 가격 히스토리
      const detail = await fetchStockDetailFromGitHub(symbol, allStocks)

      return {
        stock: detail.stock,
        priceHistory: detail.priceHistory,
      }
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : '종목 정보를 불러오는데 실패했습니다.'
      )
    }
  }
)

const stockSlice = createSlice({
  name: 'stocks',
  initialState,
  reducers: {
    setStocks: (state, action: PayloadAction<Stock[]>) => {
      state.list = action.payload
      state.lastUpdated = new Date().toISOString()
    },

    setStockList: (state, action: PayloadAction<StockListItem[]>) => {
      state.stockList = action.payload
    },

    setSelectedStock: (state, action: PayloadAction<Stock | null>) => {
      state.selectedStock = action.payload
    },

    clearError: (state) => {
      state.error = null
    },

    clearSelectedStock: (state) => {
      state.selectedStock = null
      state.selectedStockPriceHistory = []
    },

    updateStockScore: (
      state,
      action: PayloadAction<{ symbol: string; scores: Stock['scores'] }>
    ) => {
      const { symbol, scores } = action.payload
      const stock = state.list.find((s) => s.symbol === symbol)
      if (stock) {
        stock.scores = scores
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // refreshStocks
      .addCase(refreshStocks.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(refreshStocks.fulfilled, (state, action) => {
        state.loading = false
        state.list = action.payload.stocks
        state.lastUpdated = action.payload.lastUpdated
        state.isAnalyzing = false
      })
      .addCase(refreshStocks.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // fetchStockDetail
      .addCase(fetchStockDetail.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchStockDetail.fulfilled, (state, action) => {
        state.loading = false
        state.selectedStock = action.payload.stock
        state.selectedStockPriceHistory = action.payload.priceHistory
      })
      .addCase(fetchStockDetail.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const {
  setStocks,
  setStockList,
  setSelectedStock,
  clearError,
  clearSelectedStock,
  updateStockScore,
} = stockSlice.actions

export default stockSlice.reducer
