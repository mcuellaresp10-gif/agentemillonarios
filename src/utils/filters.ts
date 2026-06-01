import type { PlayerSeasonStats, ScoutCandidate } from '@/types'
import { matchesPositionFilter } from '@/utils/positions'
import { candidateMatchesPosition } from '@/utils/scoutReplacement'

export interface PlayerFilters {
  position?: string
  status?: 'all' | 'active' | 'injured' | 'suspended'
  minRating?: number
}

export interface ScoutFilters {
  position?: string
  leagueId?: number
  minRating?: number
  minGoals?: number
  minAssists?: number
  minAge?: number
  maxAge?: number
  teamId?: number
  nameQuery?: string
  nationality?: string
  minMinutes?: number
  minAppearances?: number
  minXG90?: number
  minKeyPasses?: number
  minDuelsWonPct?: number
  minPassAccuracy?: number
  minTackles?: number
  minShotsOn?: number
  minInterceptions?: number
  minMarketValueEur?: number
  maxMarketValueEur?: number
}

export function filterPlayers(
  players: PlayerSeasonStats[],
  filters: PlayerFilters,
): PlayerSeasonStats[] {
  return players.filter((p) => {
    if (!matchesPositionFilter(p.position, filters.position)) return false
    if (filters.minRating && (p.ratingAvg ?? 0) < filters.minRating) return false
    return true
  })
}

function passesMin(
  value: number | null | undefined,
  min: number | undefined,
): boolean {
  if (min == null || min <= 0) return true
  return (value ?? 0) >= min
}

export function filterScoutCandidates(
  candidates: ScoutCandidate[],
  filters: ScoutFilters,
): ScoutCandidate[] {
  const nameQ = filters.nameQuery?.trim().toLowerCase()
  const natQ = filters.nationality?.trim().toLowerCase()

  return candidates.filter((c) => {
    if (filters.leagueId && c.leagueId !== filters.leagueId) return false
    if (filters.teamId && c.teamId !== filters.teamId) return false
    if (filters.minRating && (c.ratingAvg ?? 0) < filters.minRating) return false
    if (filters.minGoals && c.goals < filters.minGoals) return false
    if (filters.minAssists && c.assists < filters.minAssists) return false
    if (filters.minAge && (c.age ?? 0) < filters.minAge) return false
    if (filters.maxAge && (c.age ?? 99) > filters.maxAge) return false
    if (!candidateMatchesPosition(c, filters.position)) return false
    if (nameQ && !c.name.toLowerCase().includes(nameQ)) return false
    if (natQ && !c.nationality.toLowerCase().includes(natQ)) return false
    if (!passesMin(c.minutes, filters.minMinutes)) return false
    if (!passesMin(c.appearances, filters.minAppearances)) return false
    if (!passesMin(c.xG90, filters.minXG90)) return false
    if (!passesMin(c.keyPasses, filters.minKeyPasses)) return false
    if (!passesMin(c.duelsWonPct, filters.minDuelsWonPct)) return false
    if (!passesMin(c.passAccuracy, filters.minPassAccuracy)) return false
    if (!passesMin(c.tackles, filters.minTackles)) return false
    if (!passesMin(c.shotsOn, filters.minShotsOn)) return false
    if (!passesMin(c.interceptions, filters.minInterceptions)) return false
    if (filters.minMarketValueEur != null && filters.minMarketValueEur > 0) {
      if (c.marketValueEur == null || c.marketValueEur < filters.minMarketValueEur)
        return false
    }
    if (
      filters.maxMarketValueEur != null &&
      filters.maxMarketValueEur > 0 &&
      c.marketValueEur != null &&
      c.marketValueEur > filters.maxMarketValueEur
    )
      return false
    return true
  })
}

export type SortField =
  | 'ratingAvg'
  | 'goals'
  | 'assists'
  | 'age'
  | 'minutes'
  | 'xG90'
  | 'keyPasses'
  | 'duelsWonPct'
  | 'shotsOn'
  | 'fitScore'
  | 'tackles'
  | 'passAccuracy'
  | 'interceptions'
  | 'marketValueEur'

export function sortPlayers<T extends PlayerSeasonStats>(
  players: T[],
  field: SortField,
  dir: 'asc' | 'desc',
  fitScores?: Record<number, number>,
): T[] {
  const sorted = [...players].sort((a, b) => {
    let av: number
    let bv: number
    if (field === 'fitScore' && fitScores) {
      av = fitScores[a.playerId] ?? 0
      bv = fitScores[b.playerId] ?? 0
    } else {
      av = (a[field as keyof PlayerSeasonStats] as number | null) ?? 0
      bv = (b[field as keyof PlayerSeasonStats] as number | null) ?? 0
    }
    return av - bv
  })
  return dir === 'desc' ? sorted.reverse() : sorted
}
