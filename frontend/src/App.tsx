import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Box, Container } from '@mui/material'
import Header from './components/common/Header'
import HomePage from './pages/HomePage'
import StockDetailPage from './pages/StockDetailPage'
import SectorAnalysisPage from './pages/SectorAnalysisPage'
import BacktestPage from './pages/BacktestPage'
import { useAppDispatch, useAppSelector } from './store'
import { refreshStocks } from './store/stockSlice'

function App() {
  const dispatch = useAppDispatch()
  const { list, loading } = useAppSelector((state) => state.stocks)

  // 앱 시작 시 데이터가 없으면 자동으로 불러오기
  useEffect(() => {
    if (list.length === 0 && !loading) {
      console.log('Auto-loading stock data...')
      dispatch(refreshStocks())
    }
  }, [dispatch, list.length, loading])

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <Container
        component="main"
        maxWidth="xl"
        sx={{
          flex: 1,
          py: 3,
        }}
      >
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sector" element={<SectorAnalysisPage />} />
          <Route path="/backtest" element={<BacktestPage />} />
          <Route path="/stock/:symbol" element={<StockDetailPage />} />
        </Routes>
      </Container>
    </Box>
  )
}

export default App
