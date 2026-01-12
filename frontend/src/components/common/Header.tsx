import { useNavigate, useLocation } from 'react-router-dom'
import {
  BarChart3,
  PieChart,
  FlaskConical,
  RefreshCw,
  Clock,
  Database,
  Trophy,
} from 'lucide-react'
import { useAppDispatch, useAppSelector } from '../../store'
import { refreshStocks } from '../../store/stockSlice'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Tooltip } from '../ui/tooltip'
import { Spinner } from '../ui/spinner'
import { cn } from '../../lib/utils'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { loading, lastUpdated, list } = useAppSelector((state) => state.stocks)

  const handleRefresh = () => {
    dispatch(refreshStocks())
  }

  const formatLastUpdated = (dateString: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  const navItems = [
    { path: '/', label: '랭킹', icon: Trophy },
    { path: '/sector', label: '섹터분석', icon: PieChart },
    { path: '/backtest', label: '전략검증', icon: FlaskConical },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <BarChart3 className="h-7 w-7 text-cyan-500 group-hover:text-cyan-400 transition-colors" />
            <span className="text-lg font-bold text-slate-50 hidden sm:block">
              Stock Analysis
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                    isActive(item.path)
                      ? 'bg-cyan-500/20 text-cyan-400'
                      : 'text-slate-400 hover:text-slate-50 hover:bg-slate-800'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              )
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Stock count */}
            {list.length > 0 && (
              <Tooltip content="로드된 종목 수">
                <Badge variant="secondary" className="gap-1.5">
                  <Database className="h-3 w-3" />
                  {list.length}개
                </Badge>
              </Tooltip>
            )}

            {/* Last updated */}
            {lastUpdated && !loading && (
              <Tooltip content="마지막 업데이트">
                <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  {formatLastUpdated(lastUpdated)}
                </div>
              </Tooltip>
            )}

            {/* Refresh button */}
            <Tooltip content="데이터 새로고침">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={loading}
                className="gap-2"
              >
                {loading ? (
                  <Spinner size="sm" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">
                  {loading ? '로딩중...' : '새로고침'}
                </span>
              </Button>
            </Tooltip>
          </div>
        </div>
      </div>
    </header>
  )
}
