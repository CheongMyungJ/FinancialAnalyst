import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import stockReducer from './stockSlice'
import filterReducer from './filterSlice'
import weightReducer from './weightSlice'

export const store = configureStore({
  reducer: {
    stocks: stockReducer,
    filters: filterReducer,
    weights: weightReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})

// 타입 정의
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

// 타입이 지정된 훅
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
