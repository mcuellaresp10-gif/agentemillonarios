import type { PlayerSeasonStats } from '@/types'
import { ratingColor } from '@/utils/calculators'
import { posicionEnEspanol } from '@/utils/positions'
import { cn } from '@/lib/utils'

const ROWS: Array<{
  label: string
  get: (p: PlayerSeasonStats) => string | number
  rating?: boolean
}> = [
  { label: 'Posición', get: (p) => posicionEnEspanol(p.position) },
  { label: 'Rating', get: (p) => p.ratingAvg?.toFixed(1) ?? '—', rating: true },
  { label: 'Partidos', get: (p) => p.appearances },
  { label: 'Minutos', get: (p) => p.minutes },
  { label: 'Goles', get: (p) => p.goals },
  { label: 'Asistencias', get: (p) => p.assists },
  { label: 'xG / 90', get: (p) => p.xG90?.toFixed(2) ?? '—' },
  { label: 'Pases clave', get: (p) => p.keyPasses ?? '—' },
  { label: '% Duelos', get: (p) => (p.duelsWonPct != null ? `${p.duelsWonPct}%` : '—') },
  { label: 'Tiros a puerta', get: (p) => p.shotsOn ?? '—' },
  { label: '% Pases', get: (p) => (p.passAccuracy != null ? `${p.passAccuracy}%` : '—') },
]

export function ComparativaJugador({
  candidato,
  actual,
}: {
  candidato: PlayerSeasonStats
  actual: PlayerSeasonStats | null
}) {
  if (!actual) {
    return (
      <p className="text-slate-500 text-sm">
        Selecciona un jugador de Millonarios para comparar estadísticas.
      </p>
    )
  }

  const better =
    (candidato.ratingAvg ?? 0) > (actual.ratingAvg ?? 0) ? 'candidato' : 'actual'

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-mill-blue text-white">
            <th className="px-4 py-2 text-left"></th>
            <th className="px-4 py-2">Candidato</th>
            <th className="px-4 py-2 text-center">vs</th>
            <th className="px-4 py-2">Millonarios</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => {
            const a = row.get(candidato)
            const b = row.get(actual)
            return (
              <tr key={row.label} className="border-b">
                <td className="px-4 py-2 text-slate-500">{row.label}</td>
                <td
                  className={cn(
                    'px-4 py-2 font-stats',
                    row.rating && ratingColor(candidato.ratingAvg),
                  )}
                >
                  {a}
                </td>
                <td className="px-4 py-2 text-center text-slate-300">vs</td>
                <td
                  className={cn(
                    'px-4 py-2 font-stats',
                    row.rating && ratingColor(actual.ratingAvg),
                  )}
                >
                  {b}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="p-3 text-sm text-center bg-slate-50">
        {better === 'candidato' ? (
          <span className="text-emerald-600 font-medium">
            El candidato supera a {actual.name} en rating
          </span>
        ) : (
          <span className="text-amber-600 font-medium">
            {actual.name} tiene mejor rating actual en Millonarios
          </span>
        )}
      </p>
    </div>
  )
}
