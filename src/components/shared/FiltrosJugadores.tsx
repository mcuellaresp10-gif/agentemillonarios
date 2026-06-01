import { Select } from '@/components/ui/select'
import { POSICIONES_FILTRO, ORDENAR_LABELS } from '@/utils/positions'
import type { SortField } from '@/utils/filters'

export function FiltrosJugadores({
  position,
  onPosition,
  minRating,
  onMinRating,
  sortField,
  sortDir,
  onSort,
  extraSortFields = [],
}: {
  position: string
  onPosition: (v: string) => void
  minRating: number
  onMinRating: (v: number) => void
  sortField: SortField | string
  sortDir: 'asc' | 'desc'
  onSort: (field: SortField | string) => void
  extraSortFields?: string[]
}) {
  const sortKeys = [
    'ratingAvg',
    'goals',
    'assists',
    'minutes',
    'age',
    ...extraSortFields,
  ]

  return (
    <div className="flex flex-wrap gap-3 items-end">
      <div>
        <label className="text-xs text-slate-500 block mb-1">Posición</label>
        <Select
          value={position}
          onChange={(e) => onPosition(e.target.value)}
          className="min-w-[180px]"
        >
          {POSICIONES_FILTRO.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="text-xs text-slate-500 block mb-1">Rating mínimo</label>
        <Select
          value={minRating}
          onChange={(e) => onMinRating(Number(e.target.value))}
          className="min-w-[140px]"
        >
          <option value={0}>Cualquiera</option>
          <option value={6.5}>6.5 o más</option>
          <option value={7}>7.0 o más</option>
          <option value={7.5}>7.5 o más</option>
          <option value={8}>8.0 o más</option>
        </Select>
      </div>
      <div>
        <label className="text-xs text-slate-500 block mb-1">Ordenar por</label>
        <div className="flex flex-wrap gap-1">
          {sortKeys.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => onSort(f)}
              className={`px-2.5 py-1.5 rounded-md text-xs border transition-colors ${
                sortField === f
                  ? 'bg-mill-blue text-white border-mill-blue'
                  : 'bg-white hover:bg-blue-50 border-slate-200'
              }`}
            >
              {ORDENAR_LABELS[f] ?? f}
              {sortField === f ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ''}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
