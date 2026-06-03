import axios from 'axios'
import type { PlayerSeasonStats, ScoutTeam } from '@/types'
import type { SeasonKey, StatsDisplaySource } from '@/types/scoutSnapshot'

const BASE = import.meta.env.VITE_SCOUT_API ?? '/api/scout'

const client = axios.create({ baseURL: BASE, timeout: 120000 })

export async function fetchScoutTeamsFromDb(
  leagueIds: number[],
  seasonKey: SeasonKey,
): Promise<ScoutTeam[] | null> {
  try {
    const { data } = await client.get<{ teams: ScoutTeam[] }>('/teams', {
      params: { leagueIds: leagueIds.join(','), seasonKey },
    })
    return data.teams?.length ? data.teams : null
  } catch {
    return null
  }
}

export async function fetchScoutPlayersFromDb(
  teamId: number,
  leagueId: number,
  leagueLabel: string,
  seasonKey: SeasonKey,
): Promise<PlayerSeasonStats[] | null> {
  try {
    const { data } = await client.get<{ players: PlayerSeasonStats[] }>('/players', {
      params: { teamId, leagueId, leagueLabel, seasonKey },
    })
    return data.players ?? null
  } catch {
    return null
  }
}

export async function fetchScoutPoolFromDb(
  entries: Array<{ teamId: number; leagueId: number; leagueLabel: string }>,
  seasonKey: SeasonKey,
): Promise<PlayerSeasonStats[] | null> {
  try {
    const { data } = await client.get<{ players: PlayerSeasonStats[] }>('/pool', {
      params: { seasonKey, entries: JSON.stringify(entries) },
    })
    return data.players?.length ? data.players : null
  } catch {
    return null
  }
}

function parseStatsDisplay(raw: unknown): StatsDisplaySource | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  if (o.kind === 'window' && (o.seasonKey === '2024-2025' || o.seasonKey === '2025-2026')) {
    return { kind: 'window', seasonKey: o.seasonKey }
  }
  if (o.kind === 'priorWindow' && (o.seasonKey === '2024-2025' || o.seasonKey === '2025-2026')) {
    return { kind: 'priorWindow', seasonKey: o.seasonKey }
  }
  if (o.kind === 'apiSeason' && typeof o.apiSeason === 'number') {
    return { kind: 'apiSeason', apiSeason: o.apiSeason }
  }
  if (o.kind === 'live') return { kind: 'live' }
  return undefined
}

export async function fetchScoutPlayerDetailFromDb(
  playerId: number,
  teamId: number,
  leagueId: number,
  leagueLabel: string,
  seasonKey: SeasonKey,
): Promise<{ player: PlayerSeasonStats; statsDisplay?: StatsDisplaySource } | null> {
  try {
    const { data } = await client.get<{
      player: PlayerSeasonStats
      statsDisplay?: unknown
    }>(`/player/${playerId}`, {
      params: { teamId, leagueId, leagueLabel, seasonKey, crossSeason: 'true' },
    })
    if (!data.player) return null
    return {
      player: data.player,
      statsDisplay: parseStatsDisplay(data.statsDisplay),
    }
  } catch {
    return null
  }
}

export async function fetchScoutPlayerFromDb(
  playerId: number,
  teamId: number,
  leagueId: number,
  leagueLabel: string,
  seasonKey: SeasonKey,
): Promise<PlayerSeasonStats | null> {
  const detail = await fetchScoutPlayerDetailFromDb(
    playerId,
    teamId,
    leagueId,
    leagueLabel,
    seasonKey,
  )
  return detail?.player ?? null
}

export async function fetchMillonariosFromDb(
  seasonKey: SeasonKey,
): Promise<PlayerSeasonStats[] | null> {
  try {
    const { data } = await client.get<{ players: PlayerSeasonStats[] }>('/millonarios', {
      params: { seasonKey },
    })
    return data.players?.length ? data.players : null
  } catch {
    return null
  }
}

export async function refreshPlayerStats(
  playerId: number,
  teamId: number,
  leagueId: number,
  seasonKey: SeasonKey,
  teamName?: string,
  leagueLabel?: string,
): Promise<PlayerSeasonStats | null> {
  try {
    const { data } = await client.post<{ player: PlayerSeasonStats }>('/fetch-player', {
      playerId,
      teamId,
      leagueId,
      seasonKey,
      teamName,
      leagueLabel,
    })
    return data.player ?? null
  } catch {
    return null
  }
}

export async function refreshTeamStats(
  teamId: number,
  leagueId: number,
  seasonKey: SeasonKey,
  teamName?: string,
  leagueLabel?: string,
): Promise<PlayerSeasonStats[] | null> {
  try {
    const { data } = await client.post<{ players: PlayerSeasonStats[] }>('/fetch-team', {
      teamId,
      leagueId,
      seasonKey,
      teamName,
      leagueLabel,
    })
    return data.players ?? null
  } catch {
    return null
  }
}
