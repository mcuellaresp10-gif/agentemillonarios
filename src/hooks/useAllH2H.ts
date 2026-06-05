import { useQueries } from '@tanstack/react-query'
import { getHeadToHead } from '@/services/apiFootball'
import type { StandingRow, Fixture } from '@/types'
import type { TeamRates } from '@/utils/monteCarlo'
import { TEAM_MILLONARIOS, CACHE_DURATION_MS } from '@/config/constants'

/** Partidos H2H a consultar por rival */
const H2H_LAST = 20
/** Partidos recientes para el escenario "Racha reciente" */
const FORM_LAST = 5

/**
 * Calcula las tasas W/D/L de Millonarios desde un array de fixtures H2H.
 * Si no hay partidos con resultado, devuelve el fallback.
 */
export function computeH2HRates(fixtures: Fixture[], fallback: TeamRates): TeamRates {
  const played = fixtures.filter((f) => f.result != null)
  if (played.length === 0) return fallback
  const wins = played.filter((f) => f.result === 'W').length
  const draws = played.filter((f) => f.result === 'D').length
  return {
    winRate: wins / played.length,
    drawRate: draws / played.length,
    loseRate: (played.length - wins - draws) / played.length,
  }
}

export interface OpponentH2H {
  teamId: number
  teamName: string
  teamLogo: string
  /** Tasas basadas en todos los partidos H2H disponibles */
  rates: TeamRates
  /** Tasas basadas en los últimos 5 partidos H2H (para escenario "Racha reciente") */
  formRates: TeamRates
  wins: number
  draws: number
  losses: number
  played: number
  isExtra?: boolean  // true si es el clásico extra (Santa Fe)
}

export interface H2HRatesResult {
  /** Tasas H2H por opponentId (historial completo) */
  ratesMap: Record<number, TeamRates>
  /** Tasas H2H por opponentId (últimos 5 partidos) */
  formRatesMap: Record<number, TeamRates>
  /** Lista enriquecida de rivales con stats para mostrar en UI */
  opponents: OpponentH2H[]
  isLoading: boolean
  /** Cuántos rivales ya cargaron sus datos H2H */
  loadedCount: number
  totalCount: number
}

export function useAllH2H(
  standings: StandingRow[] | undefined,
  fallback: TeamRates,
): H2HRatesResult {
  const opponents = (standings ?? []).filter((r) => r.team.id !== TEAM_MILLONARIOS)

  const queries = useQueries({
    queries: opponents.map((row) => ({
      queryKey: ['h2h', row.team.id, H2H_LAST],
      queryFn: () => getHeadToHead(row.team.id, H2H_LAST),
      staleTime: CACHE_DURATION_MS,
      enabled: row.team.id > 0,
    })),
  })

  const ratesMap: Record<number, TeamRates> = {}
  const formRatesMap: Record<number, TeamRates> = {}
  const opponentList: OpponentH2H[] = []
  let loadedCount = 0

  opponents.forEach((row, i) => {
    const q = queries[i]
    const fixtures: Fixture[] = q?.data ?? []

    // Ordenar por fecha descendente (más recientes primero) para el form slice
    const sorted = [...fixtures].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    )

    const allRates = computeH2HRates(sorted, fallback)
    const formRates = computeH2HRates(sorted.slice(0, FORM_LAST), fallback)

    const played = sorted.filter((f) => f.result != null)
    const wins = played.filter((f) => f.result === 'W').length
    const draws = played.filter((f) => f.result === 'D').length

    ratesMap[row.team.id] = allRates
    formRatesMap[row.team.id] = formRates

    opponentList.push({
      teamId: row.team.id,
      teamName: row.team.name,
      teamLogo: row.team.logo,
      rates: allRates,
      formRates,
      wins,
      draws,
      losses: played.length - wins - draws,
      played: played.length,
    })

    if (q?.data !== undefined) loadedCount++
  })

  return {
    ratesMap,
    formRatesMap,
    opponents: opponentList,
    isLoading: queries.some((q) => q.isLoading),
    loadedCount,
    totalCount: opponents.length,
  }
}
