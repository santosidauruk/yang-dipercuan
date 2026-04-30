import { SECTORS } from '@/lib/constants'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'

interface Props {
  sector?: string
  onSectorFilter: (sector: string | undefined) => void
}

export function SectorFilterRecommendations({ sector, onSectorFilter }: Props) {
  const selectedSector = !sector ? 'All' : sector
  return (
    <div>
      <Select
        value={selectedSector}
        onValueChange={(value) => {
          onSectorFilter(value === 'All' ? undefined : value)
        }}
        defaultValue="All"
      >
        <SelectTrigger className="w-full max-w-48">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Sector</SelectLabel>
            <SelectItem value="All">All</SelectItem>
            {SECTORS.map((s) => {
              return (
                <SelectItem value={s} key={s}>
                  {s}
                </SelectItem>
              )
            })}
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
  )
}
