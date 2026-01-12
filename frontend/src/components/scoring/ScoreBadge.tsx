import { Box, Typography } from '@mui/material'

interface ScoreBadgeProps {
  score: number
  size?: 'small' | 'medium' | 'large'
}

// 점수에 따른 색상 반환
function getScoreColor(score: number): string {
  if (score >= 8) return '#2e7d32' // 녹색 (우수)
  if (score >= 6) return '#1976d2' // 파랑 (양호)
  if (score >= 4) return '#ed6c02' // 주황 (보통)
  return '#d32f2f' // 빨강 (주의)
}

// 점수에 따른 배경 색상 반환
function getScoreBgColor(score: number): string {
  if (score >= 8) return '#e8f5e9'
  if (score >= 6) return '#e3f2fd'
  if (score >= 4) return '#fff3e0'
  return '#ffebee'
}

export default function ScoreBadge({ score, size = 'medium' }: ScoreBadgeProps) {
  const sizeStyles = {
    small: { width: 32, height: 32, fontSize: '0.75rem' },
    medium: { width: 44, height: 44, fontSize: '1rem' },
    large: { width: 64, height: 64, fontSize: '1.5rem' },
  }

  const color = getScoreColor(score)
  const bgColor = getScoreBgColor(score)
  const styles = sizeStyles[size]

  return (
    <Box
      sx={{
        width: styles.width,
        height: styles.height,
        borderRadius: '50%',
        backgroundColor: bgColor,
        border: `2px solid ${color}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Typography
        sx={{
          fontSize: styles.fontSize,
          fontWeight: 'bold',
          color: color,
        }}
      >
        {score.toFixed(1)}
      </Typography>
    </Box>
  )
}
