import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Chip,
  CircularProgress,
} from '@mui/material'
import {
  Refresh as RefreshIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../../store'
import { refreshStocks } from '../../store/stockSlice'

export default function Header() {
  const navigate = useNavigate()
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

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        <AssessmentIcon sx={{ mr: 2 }} />
        <Typography
          variant="h6"
          component="div"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/')}
        >
          Stock Analysis
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        {/* 종목 수 표시 */}
        {list.length > 0 && (
          <Chip
            label={`${list.length}개 종목`}
            size="small"
            sx={{ mr: 2, bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
          />
        )}

        {lastUpdated && !loading && (
          <Typography variant="body2" sx={{ mr: 2, opacity: 0.8 }}>
            {formatLastUpdated(lastUpdated)}
          </Typography>
        )}

        {/* 데이터 새로고침 버튼 */}
        <Button
          color="inherit"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
        >
          {loading ? '로딩중...' : '새로고침'}
        </Button>
      </Toolbar>
    </AppBar>
  )
}
