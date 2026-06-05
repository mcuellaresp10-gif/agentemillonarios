import { useMemo } from 'react'
import { useLigaStandings } from './useStandings'
import { useAllH2H, type H2HRatesResult } from './useAllH2H'
import { runMonteCarlo, type SimScenario, type SimResult, type TeamRates } from '@/utils/monteCarlo'
import { TEAM_MILLONARIOS } from '@/config/constants'

/**
 * Liga BetPlay 2026-2:
 * - 19 partidos todos contra todos (round-robin, 20 equipos × 1 vuelta)
 * - 1 jornada de clásico vs Santa Fe
 * Total: 20 partidos por equipo
 */
export const TOTAL_SEASON_GAMES = 20
export const SEASON_LABEL = '2026-2'
export const EXTRA_MATCH_RIVAL = 'Santa Fe'

/**
 * ID de Santa Fe en API-Football.
 * Se resuelve dinámicamente desde standings (más robusto), pero este valor
 * sirve de fallback si el equipo no aparece por nombre.
 */
export const SANTA_FE_ID_FALLBACK = 1114

/**
 * Umbral histórico de clasificación (top 8) en la Liga BetPlay.
 *   19 fechas → ~28–31 pts. Escalado a 20 fechas → ~30–33 pts.
 */
export const CLASSIFICATION_PTS_MIN = 30
export const CLASSIFICATION_PTS_MAX = 33

/**
 * Tasas W/D/L históricas de Millonarios calibradas con 7 torneos recientes
 * (2023-1 al 2026-1): 217 pts en 133 partidos → 1.63 pts/partido.
 * Con empate típico ~28%: W≈45%, D≈28%, L≈27%.
 */
export const MILLONARIOS_HISTORICAL_RATES: TeamRates = {
  winRate: 0.45,
  drawRate: 0.28,
  loseRate: 0.27,
}

/**
 * Si maxPlayed ≥ este umbral, asumimos que los datos de la API corresponden
 * al torneo anterior (ya terminado) y tratamos la simulación como pre-temporada.
 */
const OLD_SEASON_THRESHOLD = 10

const ITERATIONS = 10_000
const TOP_N = 8

export interface UseMonteCarloResult {
  result: SimResult | null
  isLoading: boolean
  error: Error | null
  isNewSeason: boolean
  /** Datos H2H de cada rival para mostrar en la UI */
  h2hData: H2HRatesResult
  /** ID de Santa Fe resuelto desde standings */
  santaFeId: number | null
}

export function useMonteCarlo(scenario: SimScenario = 'realistic'): UseMonteCarloResult {
  const { data: rawStandings, isLoading: standingsLoading, error } = useLigaStandings()

  /**
   * La API devuelve standings por grupos (apertura/clausura/general), por lo que
   * puede incluir hasta 3 veces cada equipo. Deduplicamos por team.id conservando
   * el primer registro (mejor posición / más puntos) de cada equipo.
   */
  const standings = useMemo(() => {
    if (!rawStandings) return undefined
    const seen = new Set<number>()
    return rawStandings.filter((r) => {
      if (seen.has(r.team.id)) return false
      seen.add(r.team.id)
      return true
    })
  }, [rawStandings])

  const isNewSeason = useMemo(() => {
    if (!standings || standings.length === 0) return true
    const maxPlayed = Math.max(...standings.map((r) => r.played))
    return maxPlayed >= OLD_SEASON_THRESHOLD
  }, [standings])

  // Resolver ID de Santa Fe desde standings (más preciso que hardcodear)
  const santaFeId = useMemo(() => {
    if (!standings) return null
    const row = standings.find(
      (r) =>
        r.team.name.toLowerCase().includes('santa fe') ||
        r.team.name.toLowerCase().includes('santafe'),
    )
    return row?.team.id ?? SANTA_FE_ID_FALLBACK
  }, [standings])

  // Cargar H2H de todos los rivales en paralelo
  const h2hData = useAllH2H(standings, MILLONARIOS_HISTORICAL_RATES)

  const result = useMemo<SimResult | null>(() => {
    if (!standings || standings.length === 0) return null

    return runMonteCarlo({
      standings,
      teamId: TEAM_MILLONARIOS,
      topN: TOP_N,
      totalSeasonGames: TOTAL_SEASON_GAMES,
      iterations: ITERATIONS,
      scenario,
      isNewSeason,
      h2hRates: h2hData.ratesMap,
      h2hFormRates: h2hData.formRatesMap,
      extraMatchOpponentId: santaFeId ?? undefined,
      targetHistoricalRates: MILLONARIOS_HISTORICAL_RATES,
    })
  }, [standings, scenario, isNewSeason, h2hData.ratesMap, h2hData.formRatesMap, santaFeId])

  return {
    result,
    isLoading: standingsLoading,
    error: error as Error | null,
    isNewSeason,
    h2hData,
    santaFeId,
  }
}
