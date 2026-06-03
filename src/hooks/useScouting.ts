import { useQuery } from '@tanstack/react-query'
import { getTeamsByLeague, getPlayersStatistics } from '@/services/apiFootball'
import {
  SCOUT_LEAGUES,
  COLOMBIANOS_EXTERIOR_LEAGUES,
  TEAM_MILLONARIOS,
  CACHE_DURATION_MS,
  type ScoutLeagueConfig,
} from '@/config/constants'
import {
  defaultSeasonKey,
  getApiSeason,
} from '@/config/scoutSnapshotSeasons'
import {
  resolveScoutPool,
  resolveScoutTeams,
  resolveTeamPlayers,
} from '@/services/scoutCatalogResolver'
import { isColombianNationality } from '@/utils/nationality'
import type { ScoutCandidate, ScoutTeam } from '@/types'
import type { SeasonKey } from '@/types/scoutSnapshot'

const WEEK = 7 * 24 * 60 * 60 * 1000

async function fetchScoutTeamsForLeagues(
  leagues: ScoutLeagueConfig[],
  seasonKey: SeasonKey,
): Promise<ScoutTeam[]> {
  return resolveScoutTeams(seasonKey, leagues, async () => {
    const all: ScoutTeam[] = []
    for (const league of leagues) {
      const apiSeason = getApiSeason(league.id, seasonKey)
      const teams = await getTeamsByLeague(league.id, apiSeason)
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
  })
}

export function useScoutTeams(seasonKey: SeasonKey = defaultSeasonKey()) {
  return useQuery({
    queryKey: [
      'scoutTeams',
      seasonKey,
      SCOUT_LEAGUES.map((l) => l.id).join(','),
    ],
    queryFn: () => fetchScoutTeamsForLeagues([...SCOUT_LEAGUES], seasonKey),
    staleTime: WEEK,
  })
}

export function useColombianosExteriorTeams(seasonKey: SeasonKey = defaultSeasonKey()) {
  return useQuery({
    queryKey: [
      'colombianosExteriorTeams',
      seasonKey,
      COLOMBIANOS_EXTERIOR_LEAGUES.map((l) => l.id).join(','),
    ],
    queryFn: () => fetchScoutTeamsForLeagues(COLOMBIANOS_EXTERIOR_LEAGUES, seasonKey),
    staleTime: WEEK,
  })
}

/** @deprecated Usar useScoutTeams — mantiene compatibilidad con Liga BetPlay sola */
export function useLigaTeams(seasonKey?: SeasonKey) {
  return useScoutTeams(seasonKey)
}

export function useTeamPlayers(
  teamId: number,
  meta: ScoutTeam | undefined,
  seasonKey: SeasonKey = defaultSeasonKey(),
) {
  return useQuery({
    queryKey: ['teamPlayers', teamId, seasonKey, meta?.leagueId],
    queryFn: async (): Promise<ScoutCandidate[]> => {
      if (teamId === TEAM_MILLONARIOS) return []
      return resolveTeamPlayers(
        seasonKey,
        teamId,
        meta
          ? { leagueId: meta.leagueId, leagueLabel: meta.leagueLabel }
          : undefined,
        async () => {
          const apiSeason = meta
            ? getApiSeason(meta.leagueId, seasonKey)
            : getApiSeason(239, seasonKey)
          const players = await getPlayersStatistics(teamId, apiSeason)
          if (!meta) return players
          return players.map((p) => ({
            ...p,
            leagueId: meta.leagueId,
            leagueLabel: meta.leagueLabel,
          }))
        },
      )
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
  seasonKey: SeasonKey = defaultSeasonKey(),
) {
  return useQuery({
    queryKey: [
      'scoutPool',
      seasonKey,
      entries.map((e) => `${e.leagueId}:${e.teamId}`).join('|'),
    ],
    queryFn: () =>
      resolveScoutPool(seasonKey, entries, async () => {
        const results: ScoutCandidate[] = []
        for (const entry of entries) {
          if (entry.teamId === TEAM_MILLONARIOS) continue
          const apiSeason = getApiSeason(entry.leagueId, seasonKey)
          const players = await getPlayersStatistics(entry.teamId, apiSeason)
          results.push(
            ...players.map((p) => ({
              ...p,
              leagueId: entry.leagueId,
              leagueLabel: entry.leagueLabel,
            })),
          )
        }
        return results
      }),
    enabled: enabled && entries.length > 0,
    staleTime: CACHE_DURATION_MS,
  })
}

/** Colombianos con nacionalidad CO en ligas fuera de Colombia */
export function useColombianosExteriorPool(
  entries: ScoutPoolEntry[],
  enabled: boolean,
  seasonKey: SeasonKey = defaultSeasonKey(),
) {
  return useQuery({
    queryKey: [
      'colombianosExteriorPool',
      seasonKey,
      entries.map((e) => `${e.leagueId}:${e.teamId}`).join('|'),
    ],
    queryFn: () =>
      resolveScoutPool(seasonKey, entries, async () => {
        const results: ScoutCandidate[] = []
        const seen = new Set<number>()
        for (const entry of entries) {
          const apiSeason = getApiSeason(entry.leagueId, seasonKey)
          const players = await getPlayersStatistics(entry.teamId, apiSeason)
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
        return results.sort(
          (a, b) =>
            (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0) ||
            a.name.localeCompare(b.name, 'es'),
        )
      }).then((all) =>
        all.filter((p) => isColombianNationality(p.nationality)),
      ),
    enabled: enabled && entries.length > 0,
    staleTime: CACHE_DURATION_MS,
  })
}

/** @deprecated Usar useScoutPool */
export function useLigaScoutPool(
  teamIds: number[],
  enabled: boolean,
  seasonKey?: SeasonKey,
) {
  const entries: ScoutPoolEntry[] = teamIds.map((id) => ({
    teamId: id,
    leagueId: 0,
    leagueLabel: '',
  }))
  return useScoutPool(entries, enabled, seasonKey)
}
