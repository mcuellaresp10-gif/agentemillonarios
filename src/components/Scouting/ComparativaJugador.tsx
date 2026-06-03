import type { PlayerSeasonStats } from '@/types'
import type { PlayerComparisonResult } from '@/utils/playerComparison'
import { ratingColor } from '@/utils/calculators'
import { cn } from '@/lib/utils'

export function ComparativaJugador({
  candidato,
  actual,
  comparison,
  statsSourceLabel,
}: {
  candidato: PlayerSeasonStats
  actual: PlayerSeasonStats | null
  comparison: PlayerComparisonResult | null
  statsSourceLabel?: string
}) {
  if (!actual || !comparison) {
    return (
      <p className="text-slate-500 text-sm">
        Selecciona un jugador de Millonarios para comparar estadísticas.
      </p>
    )
  }

  const { compositeScore, verdict, verdictText } = comparison
  const totalBar = compositeScore.candidato + compositeScore.actual || 1

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-mill-blue text-white">
            <th className="px-4 py-2 text-left"></th>
            <th className="px-4 py-2">
              <div>Candidato</div>
              {statsSourceLabel && (
                <div className="text-xs font-normal text-blue-100/90 mt-0.5">
                  {statsSourceLabel}
                </div>
              )}
            </th>
            <th className="px-4 py-2 text-center">vs</th>
            <th className="px-4 py-2">Millonarios</th>
          </tr>
        </thead>
        <tbody>
          {comparison.rows.map((row) => (
            <tr key={row.id} className="border-b">
              <td className="px-4 py-2 text-slate-500">{row.label}</td>
              <td
                className={cn(
                  'px-4 py-2 font-stats',
                  row.isRating && ratingColor(candidato.ratingAvg),
                  row.winner === 'candidato' && 'bg-emerald-50 font-medium',
                )}
              >
                {row.candidato}
              </td>
              <td className="px-4 py-2 text-center text-slate-300">vs</td>
              <td
                className={cn(
                  'px-4 py-2 font-stats',
                  row.isRating && ratingColor(actual.ratingAvg),
                  row.winner === 'actual' && 'bg-emerald-50 font-medium',
                )}
              >
                {row.actual}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="p-3 space-y-2 bg-slate-50 border-t">
        <div className="flex h-2.5 rounded-full overflow-hidden bg-slate-200">
          <div
            className="bg-mill-blue transition-all"
            style={{ width: `${(compositeScore.candidato / totalBar) * 100}%` }}
            title={`Candidato ${compositeScore.candidato}`}
          />
          <div
            className="bg-mill-gold transition-all"
            style={{ width: `${(compositeScore.actual / totalBar) * 100}%` }}
            title={`Millonarios ${compositeScore.actual}`}
          />
        </div>
        <p className="text-xs text-slate-500 text-center">
          Score compuesto: candidato {compositeScore.candidato} · Millonarios{' '}
          {compositeScore.actual}
        </p>
        <p className="text-sm text-center">
          <span
            className={cn(
              'font-medium',
              verdict === 'candidato' && 'text-emerald-600',
              verdict === 'actual' && 'text-amber-600',
              verdict === 'tie' && 'text-slate-600',
            )}
          >
            {verdictText}
          </span>
        </p>
      </div>
    </div>
  )
}
