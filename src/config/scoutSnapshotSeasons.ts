import {
  SCOUT_LEAGUES,
  COLOMBIANOS_EXTERIOR_LEAGUES,
  type ScoutLeagueConfig,
} from '@/config/constants'
import type { SeasonKey } from '@/types/scoutSnapshot'
import { SEASON_KEYS } from '@/types/scoutSnapshot'

/** Ligas con calendario europeo (temporada API = año de inicio). */
export const EUROPEAN_STYLE_LEAGUE_IDS = new Set([
  39, // Premier League
  140, // La Liga
  135, // Serie A
  78, // Bundesliga
  61, // Ligue 1
  88, // Eredivisie
  94, // Primeira Liga
  253, // MLS
  307, // Saudi Pro League
  203, // Süper Lig
  235, // Rusia — Premier League
])

const API_SEASON_BY_REGION: Record<SeasonKey, { european: number; default: number }> = {
  '2024-2025': { european: 2024, default: 2025 },
  '2025-2026': { european: 2025, default: 2026 },
}

export function isEuropeanStyleLeague(leagueId: number): boolean {
  return EUROPEAN_STYLE_LEAGUE_IDS.has(leagueId)
}

/** Overrides cuando el mapeo regional no coincide con API-Football. */
const LEAGUE_API_SEASON_OVERRIDE: Partial<
  Record<number, Partial<Record<SeasonKey, number>>>
> = {
  /** Liga MX: temporada 2025/26 aún en API como season 2025 */
  262: { '2025-2026': 2025 },
}

export function getApiSeason(leagueId: number, seasonKey: SeasonKey): number {
  const override = LEAGUE_API_SEASON_OVERRIDE[leagueId]?.[seasonKey]
  if (override != null) return override
  const row = API_SEASON_BY_REGION[seasonKey]
  return isEuropeanStyleLeague(leagueId) ? row.european : row.default
}

/** API seasons a fusionar por ventana lógica (jun 2024 – may 2026). */
export function getApiSeasonsForWindow(
  leagueId: number,
  seasonKey: SeasonKey,
): number[] {
  if (seasonKey === '2024-2025') {
    return isEuropeanStyleLeague(leagueId) ? [2024] : [2024, 2025]
  }
  const seasons = isEuropeanStyleLeague(leagueId) ? [2025] : [2025, 2026]
  const override = LEAGUE_API_SEASON_OVERRIDE[leagueId]?.[seasonKey]
  if (override != null && !seasons.includes(override)) {
    return [...new Set([...seasons, override])].sort((a, b) => a - b)
  }
  return seasons
}

/** Temporadas API para bulk histórico completo (jun 2024 – may 2026). */
export const HISTORICAL_API_SEASONS = [2024, 2025, 2026] as const

/** Todas las ligas únicas para el snapshot (SCOUT + exterior, deduplicadas por id). */
export function getUniqueSnapshotLeagues(): ScoutLeagueConfig[] {
  const map = new Map<number, ScoutLeagueConfig>()
  for (const l of [...SCOUT_LEAGUES, ...COLOMBIANOS_EXTERIOR_LEAGUES]) {
    if (!map.has(l.id)) map.set(l.id, l)
  }
  return [...map.values()].sort(
    (a, b) => a.label.localeCompare(b.label, 'es') || a.id - b.id,
  )
}

export function seasonKeyFromApiSeason(apiSeason: number): SeasonKey {
  return apiSeason >= 2026 ? '2025-2026' : '2024-2025'
}

export function defaultSeasonKey(): SeasonKey {
  return '2025-2026'
}

export function seasonKeyLabel(key: SeasonKey): string {
  return key.replace('-', '/')
}

export { SEASON_KEYS }
