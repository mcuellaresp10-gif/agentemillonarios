import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { searchPlayersByName } from '@/services/apiFootball'
import { useSnapshotSearch } from '@/hooks/useSnapshotSearch'
import { BuscadorGlobal } from '@/components/shared/BuscadorGlobal'
import { TEAM_MILLONARIOS } from '@/config/constants'
import { posicionEnEspanol } from '@/utils/positions'
import type { PlayerSeasonStats } from '@/types'

export default function Buscar() {
  const [params] = useSearchParams()
  const q = params.get('q') ?? ''

  // Búsqueda vía API (Liga Colombia, en vivo)
  const { data: apiResults, isLoading: loadingApi } = useQuery({
    queryKey: ['search', q],
    queryFn: () => searchPlayersByName(q),
    enabled: q.length >= 2,
  })

  // Búsqueda en snapshots locales (todas las ligas SA)
  const { data: snapResults, isLoading: loadingSnap } = useSnapshotSearch(q)

  const isLoading = loadingApi || loadingSnap

  // Fusionar: API tiene prioridad (datos más frescos), snapshot complementa
  const combined: PlayerSeasonStats[] = []
  const seen = new Set<number>()

  for (const p of apiResults ?? []) {
    if (!seen.has(p.playerId)) {
      seen.add(p.playerId)
      combined.push(p)
    }
  }
  for (const p of snapResults ?? []) {
    if (!seen.has(p.playerId)) {
      seen.add(p.playerId)
      combined.push(p)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-mill-blue">Búsqueda global</h1>
        <p className="text-slate-500">Jugadores de Millonarios y ligas sudamericanas</p>
      </div>
      <div className="max-w-xl">
        <BuscadorGlobal />
      </div>
      {q && (
        <>
          <p className="text-sm text-slate-500">
            Resultados para: <strong>{q}</strong>
          </p>
          {isLoading && <p className="text-slate-400 text-sm">Buscando…</p>}
          <ul className="space-y-2">
            {combined.map((p) => (
              <li key={`${p.playerId}-${p.teamId}`}>
                <Link
                  to={
                    p.teamId === TEAM_MILLONARIOS
                      ? `/estadisticas/${p.playerId}`
                      : `/scouting/${p.playerId}?team=${p.teamId}&league=${p.leagueId}&leagueLabel=${encodeURIComponent(p.leagueLabel ?? '')}`
                  }
                  className="flex items-center gap-3 p-3 rounded-lg border bg-white hover:border-mill-blue transition-colors"
                >
                  <img
                    src={p.photo || '/Millonarios.png'}
                    alt=""
                    className="h-10 w-10 rounded-full object-cover"
                    loading="lazy"
                  />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {p.teamName}
                      {p.leagueLabel ? ` · ${p.leagueLabel}` : ''}
                      {' · '}
                      {posicionEnEspanol(p.position)}
                      {p.ratingAvg ? ` · ★ ${p.ratingAvg.toFixed(1)}` : ''}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {!isLoading && combined.length === 0 && (
            <p className="text-slate-500">Sin resultados para «{q}».</p>
          )}
        </>
      )}
    </div>
  )
}
