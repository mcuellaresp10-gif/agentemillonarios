import { COMPETITIONS, type CompetitionKey } from '@/config/constants'
import { useAppStore } from '@/store/appStore'
import { Select } from '@/components/ui/select'

export function SelectorCompeticion() {
  const filter = useAppStore((s) => s.competitionFilter)
  const setCompetition = useAppStore((s) => s.setCompetition)

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="comp-filter" className="text-sm text-slate-600 shrink-0">
        Competición
      </label>
      <Select
        id="comp-filter"
        value={filter}
        onChange={(e) => setCompetition(e.target.value as CompetitionKey)}
        className="max-w-xs"
        aria-label="Filtrar por competición"
      >
        {(Object.keys(COMPETITIONS) as CompetitionKey[]).map((key) => (
          <option key={key} value={key}>
            {COMPETITIONS[key].label}
          </option>
        ))}
      </Select>
    </div>
  )
}
