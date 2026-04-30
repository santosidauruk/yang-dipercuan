import { Recommendation } from '@/types'
import { Card, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { signalColors } from '../dashboard/RecommendationWidget'
import Link from 'next/link'

interface Props {
  data: Recommendation
}

export function DailyPickCard({ data }: Props) {
  return (
    <Link href={`/stocks/${data.stockCode.replace('.JK', '')}`}>
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <CardTitle>
              {data.stockCode.replace('.JK', '')} - {data.stockName}
            </CardTitle>
            <span className="font-mono text-sm">Score: {data.score}</span>
          </div>
          <div className="flex gap-x-2">
            <Badge variant="secondary" className={signalColors[data.signal]}>
              {data.signal.toUpperCase()}
            </Badge>
            <Badge variant="secondary">{data.sector}</Badge>
          </div>
        </CardHeader>
      </Card>
    </Link>
  )
}
