import { useState } from 'react'
import { ChevronDown, RotateCcw } from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store'
import { setWeight, setCategoryWeight, applyPreset, resetWeights } from '../../store/weightSlice'
import { Slider } from '../ui/slider'
import { Button } from '../ui/button'
import { cn } from '../../lib/utils'

interface SliderItemProps {
  label: string
  value: number
  onChange: (value: number) => void
}

function SliderItem({ label, value, onChange }: SliderItemProps) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-slate-300">{label}</span>
        <span className="text-sm font-medium text-cyan-400">{value}%</span>
      </div>
      <Slider value={value} onChange={onChange} min={0} max={100} />
    </div>
  )
}

interface AccordionItemProps {
  title: string
  isExpanded: boolean
  onToggle: () => void
  children: React.ReactNode
}

function AccordionItem({ title, isExpanded, onToggle, children }: AccordionItemProps) {
  return (
    <div className="border border-slate-800 rounded-lg mb-2 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-slate-800/50 transition-colors"
      >
        <span className="text-sm font-medium text-slate-200">{title}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 text-slate-400 transition-transform',
            isExpanded && 'rotate-180'
          )}
        />
      </button>
      {isExpanded && <div className="p-3 pt-0 border-t border-slate-800">{children}</div>}
    </div>
  )
}

export default function WeightSliders() {
  const dispatch = useAppDispatch()
  const { config, presets, activePreset } = useAppSelector((state) => state.weights)
  const [expanded, setExpanded] = useState<string | null>('category')

  const handleAccordionChange = (panel: string) => {
    setExpanded(expanded === panel ? null : panel)
  }

  const handleCategoryChange = (category: 'fundamental' | 'technical' | 'news', value: number) => {
    dispatch(setCategoryWeight({ category, value }))
  }

  const handleWeightChange = (category: string, item: string, value: number) => {
    dispatch(setWeight({ category: category as 'fundamental' | 'technical' | 'news', item, value }))
  }

  const handlePresetChange = (presetId: string) => {
    dispatch(applyPreset(presetId))
  }

  const handleReset = () => {
    dispatch(resetWeights())
  }

  return (
    <div className="space-y-3">
      {/* Preset selection */}
      <div>
        <label className="block text-xs text-slate-500 mb-1.5">프리셋</label>
        <select
          value={activePreset || ''}
          onChange={(e) => handlePresetChange(e.target.value)}
          className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          {presets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>
      </div>

      {/* Category weights */}
      <AccordionItem
        title="카테고리 비중"
        isExpanded={expanded === 'category'}
        onToggle={() => handleAccordionChange('category')}
      >
        <SliderItem
          label="기본적 분석"
          value={config.category.fundamental}
          onChange={(v) => handleCategoryChange('fundamental', v)}
        />
        <SliderItem
          label="기술적 분석"
          value={config.category.technical}
          onChange={(v) => handleCategoryChange('technical', v)}
        />
        <SliderItem
          label="뉴스/공시"
          value={config.category.news}
          onChange={(v) => handleCategoryChange('news', v)}
        />
      </AccordionItem>

      {/* Fundamental analysis weights */}
      <AccordionItem
        title="기본적 분석 항목"
        isExpanded={expanded === 'fundamental'}
        onToggle={() => handleAccordionChange('fundamental')}
      >
        <SliderItem
          label="PER"
          value={config.fundamental.per}
          onChange={(v) => handleWeightChange('fundamental', 'per', v)}
        />
        <SliderItem
          label="PBR"
          value={config.fundamental.pbr}
          onChange={(v) => handleWeightChange('fundamental', 'pbr', v)}
        />
        <SliderItem
          label="ROE"
          value={config.fundamental.roe}
          onChange={(v) => handleWeightChange('fundamental', 'roe', v)}
        />
        <SliderItem
          label="영업이익률"
          value={config.fundamental.operatingMargin}
          onChange={(v) => handleWeightChange('fundamental', 'operatingMargin', v)}
        />
      </AccordionItem>

      {/* Technical analysis weights */}
      <AccordionItem
        title="기술적 분석 항목"
        isExpanded={expanded === 'technical'}
        onToggle={() => handleAccordionChange('technical')}
      >
        <SliderItem
          label="이동평균선 위치"
          value={config.technical.maPosition}
          onChange={(v) => handleWeightChange('technical', 'maPosition', v)}
        />
        <SliderItem
          label="RSI"
          value={config.technical.rsi}
          onChange={(v) => handleWeightChange('technical', 'rsi', v)}
        />
        <SliderItem
          label="거래량 추세"
          value={config.technical.volumeTrend}
          onChange={(v) => handleWeightChange('technical', 'volumeTrend', v)}
        />
        <SliderItem
          label="MACD"
          value={config.technical.macd}
          onChange={(v) => handleWeightChange('technical', 'macd', v)}
        />
      </AccordionItem>

      {/* News weights */}
      <AccordionItem
        title="뉴스/공시 항목"
        isExpanded={expanded === 'news'}
        onToggle={() => handleAccordionChange('news')}
      >
        <SliderItem
          label="감성 분석"
          value={config.news.sentiment}
          onChange={(v) => handleWeightChange('news', 'sentiment', v)}
        />
        <SliderItem
          label="빈도"
          value={config.news.frequency}
          onChange={(v) => handleWeightChange('news', 'frequency', v)}
        />
      </AccordionItem>

      {/* Reset button */}
      <Button variant="outline" size="sm" onClick={handleReset} className="w-full gap-2 mt-2">
        <RotateCcw className="h-4 w-4" />
        가중치 초기화
      </Button>
    </div>
  )
}
