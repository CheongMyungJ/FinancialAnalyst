import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
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

  useEffect(() => {
    if (list.length === 0 && !loading) {
      console.log('Auto-loading stock data...')
      dispatch(refreshStocks())
    }
  }, [dispatch, list.length, loading])

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      <Header />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/sector" element={<SectorAnalysisPage />} />
          <Route path="/backtest" element={<BacktestPage />} />
          <Route path="/stock/:symbol" element={<StockDetailPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
