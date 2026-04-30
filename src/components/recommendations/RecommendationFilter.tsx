import { SignalType } from '@/types'
import { SIGNALS } from '../dashboard/RecommendationWidget'
import { Badge } from '../ui/badge'
import { SectorFilterRecommendations } from './SectorFilterRecommendations'

interface Props {
  signal?: SignalType
  sector?: string
  onSignalFilter: (signal: SignalType | undefined) => void
  onSectorFilter: (sector: string | undefined) => void
}

export function RecommendationsFilter({
  signal,
  sector,
  onSignalFilter,
  onSectorFilter
}: Props) {
  return (
    <div>
      Filter by:
      <div className="my-2 flex items-center gap-2">
        <span>Signal:</span>
        <div className="flex gap-x-2">
          <Badge
            variant="secondary"
            className={`cursor-pointer ${
              signal === undefined
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-accent'
            }`}
            onClick={() => onSignalFilter(undefined)}
          >
            ALL
          </Badge>
          {SIGNALS.map((s) => {
            return (
              <Badge
                variant="secondary"
                key={s}
                className={`cursor-pointer ${
                  signal === s
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
                onClick={() => onSignalFilter(s)}
              >
                {s.toUpperCase()}
              </Badge>
            )
          })}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span>Sector:</span>
        <SectorFilterRecommendations
          sector={sector}
          onSectorFilter={onSectorFilter}
        />
      </div>
    </div>
  )
}
