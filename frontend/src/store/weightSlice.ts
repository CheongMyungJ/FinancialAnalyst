import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { WeightConfig, WeightPreset } from '../types'
import { DEFAULT_WEIGHTS, DEFAULT_PRESETS } from '../types'

interface WeightState {
  // 현재 가중치 설정
  config: WeightConfig

  // 저장된 프리셋들
  presets: WeightPreset[]

  // 활성화된 프리셋 ID (null이면 커스텀)
  activePreset: string | null
}

const initialState: WeightState = {
  config: DEFAULT_WEIGHTS,
  presets: DEFAULT_PRESETS,
  activePreset: 'balanced',
}

// 가중치 카테고리 타입
type WeightCategory = 'fundamental' | 'technical' | 'news' | 'category'

const weightSlice = createSlice({
  name: 'weights',
  initialState,
  reducers: {
    // 개별 가중치 변경
    setWeight: (
      state,
      action: PayloadAction<{
        category: WeightCategory
        item: string
        value: number
      }>
    ) => {
      const { category, item, value } = action.payload
      const categoryConfig = state.config[category] as Record<string, number>
      if (categoryConfig && item in categoryConfig) {
        categoryConfig[item] = value
        state.activePreset = null // 커스텀으로 변경
      }
    },

    // 카테고리 가중치 변경
    setCategoryWeight: (
      state,
      action: PayloadAction<{
        category: 'fundamental' | 'technical' | 'news'
        value: number
      }>
    ) => {
      const { category, value } = action.payload
      state.config.category[category] = value
      state.activePreset = null
    },

    // 전체 가중치 설정
    setWeightConfig: (state, action: PayloadAction<WeightConfig>) => {
      state.config = action.payload
      state.activePreset = null
    },

    // 프리셋 적용
    applyPreset: (state, action: PayloadAction<string>) => {
      const preset = state.presets.find((p) => p.id === action.payload)
      if (preset) {
        state.config = { ...preset.weights }
        state.activePreset = preset.id
      }
    },

    // 커스텀 프리셋 저장
    savePreset: (
      state,
      action: PayloadAction<{ name: string; description: string }>
    ) => {
      const { name, description } = action.payload
      const id = `custom-${Date.now()}`
      const newPreset: WeightPreset = {
        id,
        name,
        description,
        weights: { ...state.config },
      }
      state.presets.push(newPreset)
      state.activePreset = id
    },

    // 프리셋 삭제
    deletePreset: (state, action: PayloadAction<string>) => {
      const id = action.payload
      // 기본 프리셋은 삭제 불가
      if (!id.startsWith('custom-')) return

      state.presets = state.presets.filter((p) => p.id !== id)
      if (state.activePreset === id) {
        state.activePreset = 'balanced'
        const balancedPreset = state.presets.find((p) => p.id === 'balanced')
        if (balancedPreset) {
          state.config = { ...balancedPreset.weights }
        }
      }
    },

    // 가중치 초기화
    resetWeights: (state) => {
      state.config = DEFAULT_WEIGHTS
      state.activePreset = 'balanced'
    },
  },
})

export const {
  setWeight,
  setCategoryWeight,
  setWeightConfig,
  applyPreset,
  savePreset,
  deletePreset,
  resetWeights,
} = weightSlice.actions

export default weightSlice.reducer
