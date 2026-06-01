import { useQuery } from '@tanstack/react-query'
import { getTeamsByLeague, getPlayersStatistics } from '@/services/apiFootball'
import {
  SCOUT_LEAGUES,
  COLOMBIANOS_EXTERIOR_LEAGUES,
  SEASON,
  TEAM_MILLONARIOS,
  CACHE_DURATION_MS,
  type ScoutLeagueConfig,
} from '@/config/constants'
import { isColombianNationality } from '@/utils/nationality'
import type { ScoutCandidate, ScoutTeam } from '@/types'

const WEEK = 7 * 24 * 60 * 60 * 1000

async function fetchScoutTeamsForLeagues(
  leagues: ScoutLeagueConfig[],
): Promise<ScoutTeam[]> {
  const all: ScoutTeam[] = []
  for (const league of leagues) {
    const teams = await getTeamsByLeague(league.id, SEASON)
    for (const t of teams) {
      all.push({
        id: t.id,
        name: t.name,
        logo: t.logo,
        leagueId: league.id,
        leagueLabel: league.label,
      })
    }
  }
  return all.sort(
    (a, b) =>
      a.leagueLabel.localeCompare(b.leagueLabel, 'es') ||
      a.name.localeCompare(b.name, 'es'),
  )
}

export function useScoutTeams() {
  return useQuery({
    queryKey: [
      'scoutTeams',
      SEASON,
      SCOUT_LEAGUES.map((l) => l.id).join(','),
    ],
    queryFn: () => fetchScoutTeamsForLeagues([...SCOUT_LEAGUES]),
    staleTime: WEEK,
  })
}

export function useColombianosExteriorTeams() {
  return useQuery({
    queryKey: [
      'colombianosExteriorTeams',
      SEASON,
      COLOMBIANOS_EXTERIOR_LEAGUES.map((l) => l.id).join(','),
    ],
    queryFn: () => fetchScoutTeamsForLeagues(COLOMBIANOS_EXTERIOR_LEAGUES),
    staleTime: WEEK,
  })
}

/** @deprecated Usar useScoutTeams — mantiene compatibilidad con Liga BetPlay sola */
export function useLigaTeams() {
  return useScoutTeams()
}

export function useTeamPlayers(teamId: number, meta?: ScoutTeam) {
  return useQuery({
    queryKey: ['teamPlayers', teamId, SEASON, meta?.leagueId],
    queryFn: async (): Promise<ScoutCandidate[]> => {
      if (teamId === TEAM_MILLONARIOS) return []
      const players = await getPlayersStatistics(teamId, SEASON)
      if (!meta) return players
      return players.map((p) => ({
        ...p,
        leagueId: meta.leagueId,
        leagueLabel: meta.leagueLabel,
      }))
    },
    enabled: teamId > 0 && teamId !== TEAM_MILLONARIOS,
    staleTime: CACHE_DURATION_MS,
  })
}

export interface ScoutPoolEntry {
  teamId: number
  leagueId: number
  leagueLabel: string
}

/** Plantillas de varias ligas (excluye Millonarios) */
export function useScoutPool(
  entries: ScoutPoolEntry[],
  enabled: boolean,
) {
  return useQuery({
    queryKey: [
      'scoutPool',
      SEASON,
      entries.map((e) => `${e.leagueId}:${e.teamId}`).join('|'),
    ],
    queryFn: async () => {
      const results: ScoutCandidate[] = []
      for (const entry of entries) {
        if (entry.teamId === TEAM_MILLONARIOS) continue
        const players = await getPlayersStatistics(entry.teamId, SEASON)
        results.push(
          ...players.map((p) => ({
            ...p,
            leagueId: entry.leagueId,
            leagueLabel: entry.leagueLabel,
          })),
        )
      }
      return results
    },
    enabled: enabled && entries.length > 0,
    staleTime: CACHE_DURATION_MS,
  })
}

/** Colombianos con nacionalidad CO en ligas fuera de Colombia */
export function useColombianosExteriorPool(
  entries: ScoutPoolEntry[],
  enabled: boolean,
) {
  return useQuery({
    queryKey: [
      'colombianosExteriorPool',
      SEASON,
      entries.map((e) => `${e.leagueId}:${e.teamId}`).join('|'),
    ],
    queryFn: async () => {
      const results: ScoutCandidate[] = []
      const seen = new Set<number>()
      for (const entry of entries) {
        const players = await getPlayersStatistics(entry.teamId, SEASON)
        for (const p of players) {
          if (!isColombianNationality(p.nationality)) continue
          if (seen.has(p.playerId)) continue
          seen.add(p.playerId)
          results.push({
            ...p,
            leagueId: entry.leagueId,
            leagueLabel: entry.leagueLabel,
          })
        }
      }
      return results.sort((a, b) =>
        (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0) ||
        a.name.localeCompare(b.name, 'es'),
      )
    },
    enabled: enabled && entries.length > 0,
    staleTime: CACHE_DURATION_MS,
  })
}

/** @deprecated Usar useScoutPool */
export function useLigaScoutPool(teamIds: number[], enabled: boolean) {
  const entries: ScoutPoolEntry[] = teamIds.map((id) => ({
    teamId: id,
    leagueId: 0,
    leagueLabel: '',
  }))
  return useScoutPool(entries, enabled)
}
