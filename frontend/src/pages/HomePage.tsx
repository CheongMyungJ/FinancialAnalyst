import { Trophy } from 'lucide-react'
import RankingTable from '../components/ranking/RankingTable'
import RankingFilters from '../components/ranking/RankingFilters'
import WeightSliders from '../components/scoring/WeightSliders'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'

export default function HomePage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-amber-500" />
          <h1 className="text-2xl font-bold text-slate-50">종목 랭킹</h1>
        </div>
        <p className="text-slate-400">
          기본적 분석, 기술적 분석, 뉴스 분석을 종합한 점수로 종목을 평가합니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left sidebar - Filters & Weights */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">필터</CardTitle>
            </CardHeader>
            <CardContent>
              <RankingFilters />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">점수 가중치</CardTitle>
            </CardHeader>
            <CardContent>
              <WeightSliders />
            </CardContent>
          </Card>
        </div>

        {/* Right content - Ranking Table */}
        <div className="lg:col-span-3">
          <Card className="overflow-hidden">
            <RankingTable />
          </Card>
        </div>
      </div>
    </div>
  )
}
