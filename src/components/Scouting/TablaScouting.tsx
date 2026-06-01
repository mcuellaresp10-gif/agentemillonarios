import { Link } from 'react-router-dom'
import type { ScoutCandidate } from '@/types'
import { ratingColor } from '@/utils/calculators'
import { posicionEnEspanol } from '@/utils/positions'
import { fitScoreLabel } from '@/utils/scoutReplacement'
import { formatEurShort } from '@/utils/formatMarketValue'
import { cn } from '@/lib/utils'
import type { CandidateEnrichment } from '@/hooks/useCandidatesEnrichment'
import type { SortField } from '@/utils/filters'
import { ORDENAR_LABELS } from '@/utils/positions'

const AFFINITY_TOOLTIP =
  'Utilidad estimada para Millonarios FC (0–100)'

const STAT_COLUMNS: Array<{ key: SortField; label: string }> = [
  { key: 'ratingAvg', label: 'Rating' },
  { key: 'goals', label: 'Goles' },
  { key: 'assists', label: 'Asist.' },
  { key: 'minutes', label: 'Min.' },
  { key: 'xG90', label: 'xG/90' },
  { key: 'keyPasses', label: 'Pases clave' },
  { key: 'duelsWonPct', label: '% Duelos' },
  { key: 'tackles', label: 'Entradas' },
  { key: 'passAccuracy', label: '% Pases' },
  { key: 'age', label: 'Edad' },
]

export function TablaScouting({
  players,
  sortField,
  sortDir,
  onSort,
  fitScores,
  showFitScore,
  showNationality = false,
  showLeague = false,
  showValueColumns = false,
  enrichment,
}: {
  players: ScoutCandidate[]
  sortField: SortField
  sortDir: 'asc' | 'desc'
  onSort: (f: SortField) => void
  fitScores?: Record<number, number>
  showFitScore?: boolean
  showNationality?: boolean
  showLeague?: boolean
  showValueColumns?: boolean
  enrichment?: Record<number, CandidateEnrichment>
}) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full text-sm min-w-[720px]">
        <thead>
          <tr className="bg-mill-blue text-white text-left">
            <th className="px-3 py-2">Jugador</th>
            <th className="px-3 py-2">Posición</th>
            {showNationality && <th className="px-3 py-2">Nacionalidad</th>}
            {showValueColumns && (
              <>
                <th className="px-3 py-2">Valor mercado</th>
                <th className="px-3 py-2">Último traspaso</th>
              </>
            )}
            {showFitScore && (
              <th className="px-3 py-2 font-stats" title={AFFINITY_TOOLTIP}>
                <button
                  type="button"
                  onClick={() => onSort('fitScore')}
                  className="hover:underline"
                  title={AFFINITY_TOOLTIP}
                >
                  {ORDENAR_LABELS.fitScore ?? 'Afinidad'}
                  {sortField === 'fitScore' ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ''}
                </button>
              </th>
            )}
            {STAT_COLUMNS.map((c) => (
              <th key={c.key} className="px-3 py-2 font-stats">
                <button
                  type="button"
                  onClick={() => onSort(c.key)}
                  className="hover:underline"
                >
                  {ORDENAR_LABELS[c.key] ?? c.label}
                  {sortField === c.key ? (sortDir === 'desc' ? ' ▼' : ' ▲') : ''}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {players.map((p) => {
            const extra = enrichment?.[p.playerId]
            const marketLabel =
              p.marketValueLabel ??
              extra?.marketValueLabel ??
              (p.marketValueEur != null || extra?.marketValueEur != null
                ? formatEurShort(p.marketValueEur ?? extra?.marketValueEur)
                : null)
            const transferFee =
              p.lastTransferFee ?? extra?.lastTransferFee ?? null
            return (
            <tr key={`${p.playerId}-${p.teamId}`} className="border-b hover:bg-blue-50/50">
              <td className="px-3 py-2">
                <Link
                  to={`/scouting/${p.playerId}?team=${p.teamId}`}
                  className="font-medium text-mill-blue hover:underline flex items-center gap-2"
                >
                  <img
                    src={p.photo || '/millonarios.svg'}
                    alt=""
                    className="h-7 w-7 rounded-full"
                    loading="lazy"
                  />
                  <span>
                    {p.name}
                    <span className="block text-xs text-slate-400 font-normal">
                      {p.teamName}
                      {showLeague && p.leagueLabel && (
                        <span className="text-slate-300"> · {p.leagueLabel}</span>
                      )}
                    </span>
                  </span>
                </Link>
              </td>
              <td className="px-3 py-2 text-xs">
                {posicionEnEspanol(p.position)}
              </td>
              {showNationality && (
                <td className="px-3 py-2 text-xs text-slate-600">
                  {p.nationality || '—'}
                </td>
              )}
              {showValueColumns && (
                <>
                  <td className="px-3 py-2 text-xs font-stats">
                    {marketLabel ? (
                      <span
                        title={
                          extra?.marketMatchConfidence === 'baja'
                            ? 'Coincidencia baja en Transfermarkt'
                            : undefined
                        }
                        className={
                          extra?.marketMatchConfidence === 'baja'
                            ? 'text-amber-700'
                            : 'text-mill-blue'
                        }
                      >
                        {marketLabel}
                      </span>
                    ) : enrichment && extra === undefined ? (
                      <span className="text-slate-300">…</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-slate-600">
                    {transferFee ?? (enrichment && extra === undefined ? '…' : '—')}
                  </td>
                </>
              )}
              {showFitScore && (
                <td className="px-3 py-2" title={AFFINITY_TOOLTIP}>
                  {fitScores?.[p.playerId] != null ? (
                    <span
                      className={cn(
                        'inline-flex flex-col items-start font-stats text-sm font-semibold',
                        fitScores[p.playerId] >= 55
                          ? 'text-emerald-700'
                          : fitScores[p.playerId] >= 40
                            ? 'text-amber-700'
                            : 'text-slate-500',
                      )}
                    >
                      {fitScores[p.playerId]}
                      <span className="text-[10px] font-normal text-slate-400">
                        {fitScoreLabel(fitScores[p.playerId])}
                      </span>
                    </span>
                  ) : (
                    '—'
                  )}
                </td>
              )}
              <td className={cn('px-3 py-2 font-stats', ratingColor(p.ratingAvg))}>
                {p.ratingAvg?.toFixed(1) ?? '—'}
              </td>
              <td className="px-3 py-2 font-stats">{p.goals}</td>
              <td className="px-3 py-2 font-stats">{p.assists}</td>
              <td className="px-3 py-2 font-stats">{p.minutes}</td>
              <td className="px-3 py-2 font-stats">
                {p.xG90?.toFixed(2) ?? '—'}
              </td>
              <td className="px-3 py-2 font-stats">{p.keyPasses ?? '—'}</td>
              <td className="px-3 py-2 font-stats">
                {p.duelsWonPct != null ? `${p.duelsWonPct}%` : '—'}
              </td>
              <td className="px-3 py-2 font-stats">{p.tackles ?? '—'}</td>
              <td className="px-3 py-2 font-stats">
                {p.passAccuracy != null ? `${p.passAccuracy}%` : '—'}
              </td>
              <td className="px-3 py-2 font-stats">{p.age ?? '—'}</td>
            </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
