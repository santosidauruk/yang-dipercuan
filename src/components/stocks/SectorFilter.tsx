import { SECTORS } from '@/lib/constants'

interface Props {
  sector?: string
  onSectorChange: (sector?: string) => void
}

export function SectorFilter({ sector, onSectorChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSectorChange(undefined)}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
          !sector
            ? 'bg-primary text-primary-foreground'
            : 'bg-secondary text-secondary-foreground hover:bg-accent'
        }`}
      >
        All
      </button>
      {SECTORS.map((s) => (
        <button
          key={s}
          onClick={() => onSectorChange(s)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            sector === s
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground hover:bg-accent'
          }`}
        >
          {s}
        </button>
      ))}
    </div>
  )
}
