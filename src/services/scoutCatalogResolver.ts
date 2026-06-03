import type { ScoutLeagueConfig } from '@/config/constants'
import type { PlayerSeasonStats, ScoutTeam } from '@/types'
import type { SeasonKey } from '@/types/scoutSnapshot'
import {
  getSnapshotMillonariosPlayers,
  getSnapshotPlayersForTeams,
  getSnapshotTeamPlayers,
  getSnapshotTeamsForLeagues,
  type SnapshotPoolEntry,
} from '@/services/snapshotStore'

const FORCE_LIVE = import.meta.env.VITE_FORCE_LIVE_API === 'true'

function shouldUseSnapshot(): boolean {
  return !FORCE_LIVE
}

export async function resolveScoutTeams(
  seasonKey: SeasonKey,
  leagues: ScoutLeagueConfig[],
  fallback: () => Promise<ScoutTeam[]>,
): Promise<ScoutTeam[]> {
  if (!shouldUseSnapshot()) return fallback()
  const leagueIds = leagues.map((l) => l.id)
  const teams = await getSnapshotTeamsForLeagues(seasonKey, leagueIds)
  if (teams.length) return teams
  return fallback()
}

export async function resolveTeamPlayers(
  seasonKey: SeasonKey,
  teamId: number,
  meta: { leagueId: number; leagueLabel: string } | undefined,
  fallback: () => Promise<PlayerSeasonStats[]>,
): Promise<PlayerSeasonStats[]> {
  if (!shouldUseSnapshot() || !meta) return fallback()
  const snap = await getSnapshotTeamPlayers(
    seasonKey,
    teamId,
    meta.leagueId,
    meta.leagueLabel,
  )
  if (snap?.length) return snap
  return fallback()
}

export async function resolveScoutPool(
  seasonKey: SeasonKey,
  entries: SnapshotPoolEntry[],
  fallback: () => Promise<PlayerSeasonStats[]>,
): Promise<PlayerSeasonStats[]> {
  if (!shouldUseSnapshot()) return fallback()
  const players = await getSnapshotPlayersForTeams(seasonKey, entries)
  if (players.length) return players
  return fallback()
}

export async function resolveMillonariosPlayers(
  seasonKey: SeasonKey,
  fallback: () => Promise<PlayerSeasonStats[]>,
): Promise<PlayerSeasonStats[]> {
  if (!shouldUseSnapshot()) return fallback()
  const players = await getSnapshotMillonariosPlayers(seasonKey)
  if (players?.length) return players
  return fallback()
}

export type { SnapshotPoolEntry }
