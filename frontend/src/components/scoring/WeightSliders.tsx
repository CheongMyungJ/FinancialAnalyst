import { useState } from 'react'
import {
  Box,
  Slider,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material'
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import { useAppDispatch, useAppSelector } from '../../store'
import { setWeight, setCategoryWeight, applyPreset, resetWeights } from '../../store/weightSlice'

interface SliderItemProps {
  label: string
  value: number
  onChange: (value: number) => void
}

function SliderItem({ label, value, onChange }: SliderItemProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2">{label}</Typography>
        <Typography variant="body2" color="primary">
          {value}%
        </Typography>
      </Box>
      <Slider
        value={value}
        onChange={(_, newValue) => onChange(newValue as number)}
        min={0}
        max={100}
        size="small"
      />
    </Box>
  )
}

export default function WeightSliders() {
  const dispatch = useAppDispatch()
  const { config, presets, activePreset } = useAppSelector((state) => state.weights)
  const [expanded, setExpanded] = useState<string | false>('category')

  const handleAccordionChange = (panel: string) => (_: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false)
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
    <Box>
      {/* 프리셋 선택 */}
      <FormControl fullWidth size="small" sx={{ mb: 2 }}>
        <InputLabel>프리셋</InputLabel>
        <Select
          value={activePreset || ''}
          label="프리셋"
          onChange={(e) => handlePresetChange(e.target.value)}
        >
          {presets.map((preset) => (
            <MenuItem key={preset.id} value={preset.id}>
              {preset.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* 카테고리 가중치 */}
      <Accordion expanded={expanded === 'category'} onChange={handleAccordionChange('category')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">카테고리 비중</Typography>
        </AccordionSummary>
        <AccordionDetails>
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
        </AccordionDetails>
      </Accordion>

      {/* 기본적 분석 항목 가중치 */}
      <Accordion expanded={expanded === 'fundamental'} onChange={handleAccordionChange('fundamental')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">기본적 분석 항목</Typography>
        </AccordionSummary>
        <AccordionDetails>
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
        </AccordionDetails>
      </Accordion>

      {/* 기술적 분석 항목 가중치 */}
      <Accordion expanded={expanded === 'technical'} onChange={handleAccordionChange('technical')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">기술적 분석 항목</Typography>
        </AccordionSummary>
        <AccordionDetails>
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
        </AccordionDetails>
      </Accordion>

      {/* 뉴스/공시 항목 가중치 */}
      <Accordion expanded={expanded === 'news'} onChange={handleAccordionChange('news')}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="subtitle2">뉴스/공시 항목</Typography>
        </AccordionSummary>
        <AccordionDetails>
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
        </AccordionDetails>
      </Accordion>

      {/* 초기화 버튼 */}
      <Button fullWidth variant="outlined" onClick={handleReset} sx={{ mt: 2 }}>
        가중치 초기화
      </Button>
    </Box>
  )
}
