import { useQueries } from '@tanstack/react-query'
import { getAllLeaguePlayers } from '@/services/snapshotStore'
import { SCOUT_LEAGUES } from '@/config/constants'
import { defaultSeasonKey } from '@/config/scoutSnapshotSeasons'
import type { PlayerSeasonStats } from '@/types'

const WEEK = 7 * 24 * 60 * 60 * 1000

/** Busca jugadores por nombre en todos los snapshots de ligas SA cargadas localmente. */
export function useSnapshotSearch(query: string) {
  const seasonKey = defaultSeasonKey()
  const q = query.trim().toLowerCase()

  const results = useQueries({
    queries: SCOUT_LEAGUES.map((league) => ({
      queryKey: ['leagueAllPlayers', league.id, seasonKey],
      queryFn: () => getAllLeaguePlayers(league.id, seasonKey),
      staleTime: WEEK,
      enabled: q.length >= 2,
    })),
  })

  const isLoading = q.length >= 2 && results.some((r) => r.isLoading)

  const matches: PlayerSeasonStats[] = []
  if (q.length >= 2) {
    for (const r of results) {
      if (!r.data) continue
      for (const p of r.data) {
        if (p.name.toLowerCase().includes(q)) {
          matches.push(p)
        }
      }
    }
  }

  // Deduplicar por playerId (mismo jugador puede aparecer en varios snapshots)
  const seen = new Set<number>()
  const deduped = matches.filter((p) => {
    if (seen.has(p.playerId)) return false
    seen.add(p.playerId)
    return true
  })

  // Ordenar: coincidencias exactas primero, luego por rating desc
  deduped.sort((a, b) => {
    const aExact = a.name.toLowerCase().startsWith(q) ? 0 : 1
    const bExact = b.name.toLowerCase().startsWith(q) ? 0 : 1
    if (aExact !== bExact) return aExact - bExact
    return (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0)
  })

  return { data: deduped.slice(0, 30), isLoading }
}
