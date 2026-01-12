import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
  PieChart as PieChartIcon,
  Science as ScienceIcon,
  EmojiEvents as TrophyIcon,
  Schedule as ScheduleIcon,
  Storage as StorageIcon,
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store'
import { refreshStocks } from '../../store/stockSlice'

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const { loading, lastUpdated, list } = useAppSelector(
    (state) => state.stocks
  )

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

  const navButtonStyle = (path: string) => ({
    borderRadius: 2,
    px: 2,
    py: 0.75,
    bgcolor: isActive(path) ? 'rgba(255,255,255,0.2)' : 'transparent',
    '&:hover': {
      bgcolor: 'rgba(255,255,255,0.15)',
    },
  })

  return (
    <AppBar
      position="static"
      elevation={2}
      sx={{
        background: 'linear-gradient(90deg, #1976d2 0%, #1565c0 100%)',
      }}
    >
      <Toolbar>
        {/* 로고 */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            mr: 1,
          }}
          onClick={() => navigate('/')}
        >
          <AssessmentIcon sx={{ fontSize: 28, mr: 1 }} />
          <Typography
            variant="h6"
            component="div"
            fontWeight="bold"
            sx={{
              letterSpacing: -0.5,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            Stock Analysis
          </Typography>
        </Box>

        {/* 네비게이션 */}
        <Box sx={{ ml: 2, display: 'flex', gap: 0.5 }}>
          <Button
            color="inherit"
            size="small"
            startIcon={<TrophyIcon />}
            onClick={() => navigate('/')}
            sx={navButtonStyle('/')}
          >
            랭킹
          </Button>
          <Button
            color="inherit"
            size="small"
            startIcon={<PieChartIcon />}
            onClick={() => navigate('/sector')}
            sx={navButtonStyle('/sector')}
          >
            섹터분석
          </Button>
          <Button
            color="inherit"
            size="small"
            startIcon={<ScienceIcon />}
            onClick={() => navigate('/backtest')}
            sx={navButtonStyle('/backtest')}
          >
            전략검증
          </Button>
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* 종목 수 표시 */}
        {list.length > 0 && (
          <Tooltip title="로드된 종목 수">
            <Chip
              icon={<StorageIcon sx={{ fontSize: 16, color: 'white !important' }} />}
              label={`${list.length}개`}
              size="small"
              sx={{
                mr: 1.5,
                bgcolor: 'rgba(255,255,255,0.15)',
                color: 'white',
                fontWeight: 'bold',
                '& .MuiChip-icon': { color: 'white' },
              }}
            />
          </Tooltip>
        )}

        {/* 마지막 업데이트 시간 */}
        {lastUpdated && !loading && (
          <Tooltip title="마지막 업데이트">
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1.5, opacity: 0.9 }}>
              <ScheduleIcon sx={{ fontSize: 16, mr: 0.5 }} />
              <Typography variant="body2">
                {formatLastUpdated(lastUpdated)}
              </Typography>
            </Box>
          </Tooltip>
        )}

        {/* 데이터 새로고침 버튼 */}
        <Tooltip title="데이터 새로고침">
          <span>
            <Button
              color="inherit"
              variant="outlined"
              size="small"
              startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <RefreshIcon />}
              onClick={handleRefresh}
              disabled={loading}
              sx={{
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              {loading ? '로딩중...' : '새로고침'}
            </Button>
          </span>
        </Tooltip>
      </Toolbar>
    </AppBar>
  )
}
