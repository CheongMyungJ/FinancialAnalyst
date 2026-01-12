import { cn } from '../../lib/utils'

interface ScoreBadgeProps {
  score: number
  size?: 'small' | 'medium' | 'large'
}

function getScoreStyle(score: number): string {
  if (score >= 8) return 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
  if (score >= 6) return 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400'
  if (score >= 4) return 'bg-amber-500/20 border-amber-500/50 text-amber-400'
  return 'bg-rose-500/20 border-rose-500/50 text-rose-400'
}

export default function ScoreBadge({ score, size = 'medium' }: ScoreBadgeProps) {
  const sizeStyles = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-11 h-11 text-sm',
    large: 'w-16 h-16 text-xl',
  }

  return (
    <div
      className={cn(
        'rounded-full border-2 flex items-center justify-center font-bold transition-all',
        sizeStyles[size],
        getScoreStyle(score)
      )}
    >
      {score.toFixed(1)}
    </div>
  )
}
