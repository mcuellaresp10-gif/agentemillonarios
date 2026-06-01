import type { PlayerSeasonStats } from '@/types'

const STAT_ITEMS: Array<{
  key: keyof PlayerSeasonStats
  label: string
  format?: (v: number) => string
}> = [
  { key: 'appearances', label: 'Partidos' },
  { key: 'minutes', label: 'Minutos' },
  { key: 'goals', label: 'Goles' },
  { key: 'assists', label: 'Asistencias' },
  { key: 'shotsOn', label: 'Tiros a puerta' },
  { key: 'shotsTotal', label: 'Tiros totales' },
  { key: 'xG', label: 'xG' },
  { key: 'xG90', label: 'xG / 90 min' },
  { key: 'keyPasses', label: 'Pases clave' },
  { key: 'passes', label: 'Pases' },
  { key: 'passAccuracy', label: '% Pases precisos' },
  { key: 'duelsWonPct', label: '% Duelos ganados' },
  { key: 'tackles', label: 'Entradas' },
  { key: 'interceptions', label: 'Intercepciones' },
  { key: 'dribblesSuccess', label: 'Regates exitosos' },
  { key: 'yellow', label: 'Amarillas' },
  { key: 'red', label: 'Rojas' },
  { key: 'saves', label: 'Atajadas' },
]

export function CuadriculaStats({ player }: { player: PlayerSeasonStats }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {STAT_ITEMS.map(({ key, label, format }) => {
        const raw = player[key]
        if (raw == null || raw === '—') return null
        if (typeof raw === 'number' && raw === 0 && key !== 'goals' && key !== 'assists')
          return null
        const value =
          typeof raw === 'number' && format ? format(raw) : String(raw)
        return (
          <div
            key={key}
            className="rounded-lg border border-slate-100 bg-slate-50/80 p-3 text-center"
          >
            <p className="text-[11px] text-slate-500 leading-tight">{label}</p>
            <p className="text-lg font-stats font-semibold text-mill-blue mt-1">
              {value}
            </p>
          </div>
        )
      })}
    </div>
  )
}
