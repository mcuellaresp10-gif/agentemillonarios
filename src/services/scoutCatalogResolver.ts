import type { ScoutLeagueConfig } from '@/config/constants'
import type { PlayerSeasonStats, ScoutTeam } from '@/types'
import type { SeasonKey } from '@/types/scoutSnapshot'
import {
  fetchMillonariosFromDb,
  fetchScoutPlayerFromDb,
  fetchScoutPlayersFromDb,
  fetchScoutPoolFromDb,
  fetchScoutTeamsFromDb,
} from '@/services/scoutApi'
import {
  getSnapshotMillonariosPlayers,
  getSnapshotPlayersForTeams,
  getSnapshotTeamPlayers,
  getSnapshotTeamsForLeagues,
  type SnapshotPoolEntry,
} from '@/services/snapshotStore'

const FORCE_LIVE = import.meta.env.VITE_FORCE_LIVE_API === 'true'

function shouldUseLocalCatalog(): boolean {
  return !FORCE_LIVE
}

export async function resolveScoutTeams(
  seasonKey: SeasonKey,
  leagues: ScoutLeagueConfig[],
  fallback: () => Promise<ScoutTeam[]>,
): Promise<ScoutTeam[]> {
  if (!shouldUseLocalCatalog()) return fallback()
  const leagueIds = leagues.map((l) => l.id)
  const db = await fetchScoutTeamsFromDb(leagueIds, seasonKey)
  if (db?.length) return db
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
  if (!shouldUseLocalCatalog() || !meta) return fallback()
  const db = await fetchScoutPlayersFromDb(
    teamId,
    meta.leagueId,
    meta.leagueLabel,
    seasonKey,
  )
  if (db?.length) return db
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
  if (!shouldUseLocalCatalog()) return fallback()
  const db = await fetchScoutPoolFromDb(entries, seasonKey)
  if (db?.length) return db
  const players = await getSnapshotPlayersForTeams(seasonKey, entries)
  if (players.length) return players
  return fallback()
}

export async function resolveMillonariosPlayers(
  seasonKey: SeasonKey,
  fallback: () => Promise<PlayerSeasonStats[]>,
): Promise<PlayerSeasonStats[]> {
  if (!shouldUseLocalCatalog()) return fallback()
  const db = await fetchMillonariosFromDb(seasonKey)
  if (db?.length) return db
  const players = await getSnapshotMillonariosPlayers(seasonKey)
  if (players?.length) return players
  return fallback()
}

export async function resolveScoutPlayer(
  seasonKey: SeasonKey,
  playerId: number,
  teamId: number,
  meta: { leagueId: number; leagueLabel: string },
  fallback: () => Promise<PlayerSeasonStats | null>,
): Promise<PlayerSeasonStats | null> {
  if (!shouldUseLocalCatalog()) return fallback()
  const db = await fetchScoutPlayerFromDb(
    playerId,
    teamId,
    meta.leagueId,
    meta.leagueLabel,
    seasonKey,
  )
  if (db) return db
  const snap = await getSnapshotTeamPlayers(
    seasonKey,
    teamId,
    meta.leagueId,
    meta.leagueLabel,
  )
  const fromSnap = snap?.find((p) => p.playerId === playerId) ?? null
  if (fromSnap) return fromSnap
  return fallback()
}

export type { SnapshotPoolEntry }
