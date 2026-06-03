import { TEAM_MILLONARIOS } from '../../src/config/constants.ts'
import {
  getApiSeasonsForWindow,
  getUniqueSnapshotLeagues,
} from '../../src/config/scoutSnapshotSeasons.ts'
import type { SeasonKey } from '../../src/types/scoutSnapshot.ts'
import { SEASON_KEYS } from '../../src/types/scoutSnapshot.ts'
import type { PlayerSeasonStats, ScoutTeam } from '../../src/types/index.ts'
import { mergePlayerStatistics } from '../../src/services/playerMerge.ts'
import {
  clearLeagueSeason,
  logSync,
  setMeta,
  upsertPlayerStat,
  upsertTeam,
  type StatsSource,
} from '../db/scoutDb.ts'
import { createScoutApiClient, type ScoutApiClient } from './scoutApiClient.ts'

export interface SyncLeagueResult {
  leagueId: number
  label: string
  seasonKey: SeasonKey
  teamCount: number
  playerCount: number
}

export function createSyncContext(apiKey: string, delayMs = 80) {
  let requestsUsed = 0
  const client = createScoutApiClient({
    apiKey,
    delayMs,
    onRequest: () => {
      requestsUsed++
    },
  })
  return {
    client,
    getRequestsUsed: () => requestsUsed,
    resetRequests: () => {
      requestsUsed = 0
    },
  }
}

async function collectPlayerIds(
  client: ScoutApiClient,
  teamId: number,
  apiSeasons: number[],
): Promise<number[]> {
  const squad = await client.fetchSquad(teamId)
  if (squad.length) return squad.map((s) => s.id)
  const ids = new Set<number>()
  for (const apiSeason of apiSeasons) {
    const paginated = await client.fetchTeamPlayersPaginated(teamId, apiSeason)
    for (const p of paginated) ids.add(p.playerId)
  }
  return [...ids]
}

async function syncOneTeam(
  client: ScoutApiClient,
  team: { id: number; name: string; logo: string },
  leagueId: number,
  leagueLabel: string,
  seasonKey: SeasonKey,
  source: StatsSource,
): Promise<number> {
  const apiSeasons = getApiSeasonsForWindow(leagueId, seasonKey)
  const scoutTeam: ScoutTeam = {
    id: team.id,
    name: team.name,
    logo: team.logo,
    leagueId,
    leagueLabel,
  }
  for (const apiSeason of apiSeasons) {
    upsertTeam(scoutTeam, apiSeason, seasonKey, source)
  }

  const playerIds = await collectPlayerIds(client, team.id, apiSeasons)
  let stored = 0

  for (const apiSeason of apiSeasons) {
    if (playerIds.length) {
      for (const playerId of playerIds) {
        try {
          const rows = await client.fetchPlayerStatsById(playerId, apiSeason)
          const forTeam = rows.filter((r) => r.teamId === team.id || r.teamId === 0)
          if (forTeam.length) {
            for (const raw of forTeam) {
              upsertPlayerStat(
                {
                  ...raw,
                  teamId: team.id,
                  teamName: team.name,
                  leagueId,
                  leagueLabel,
                },
                leagueId,
                apiSeason,
                seasonKey,
                source,
              )
              stored++
            }
          }
        } catch {
          /* sin stats en esta temporada */
        }
      }
    } else {
      const paginated = await client.fetchTeamPlayersPaginated(team.id, apiSeason)
      for (const raw of paginated) {
        upsertPlayerStat(
          { ...raw, teamId: team.id, teamName: team.name, leagueId, leagueLabel },
          leagueId,
          apiSeason,
          seasonKey,
          source,
        )
        stored++
      }
    }
  }

  return stored
}

export async function syncLeagueSeasonToDb(
  ctx: ReturnType<typeof createSyncContext>,
  leagueId: number,
  label: string,
  seasonKey: SeasonKey,
  source: StatsSource = 'bulk',
): Promise<SyncLeagueResult | null> {
  const apiSeasons = getApiSeasonsForWindow(leagueId, seasonKey)
  let teams = await ctx.client.fetchTeams(leagueId, apiSeasons[0]!)
  if (!teams.length) {
    for (const s of apiSeasons.slice(1)) {
      teams = await ctx.client.fetchTeams(leagueId, s)
      if (teams.length) break
    }
  }
  if (!teams.length) return null

  clearLeagueSeason(leagueId, seasonKey)

  const uniqueTeams = new Map<number, (typeof teams)[0]>()
  for (const t of teams) uniqueTeams.set(t.id, t)

  let playerCount = 0
  for (const team of uniqueTeams.values()) {
    playerCount += await syncOneTeam(
      ctx.client,
      team,
      leagueId,
      label,
      seasonKey,
      source,
    )
  }

  logSync('league', `${leagueId}:${seasonKey}`, ctx.getRequestsUsed())

  return {
    leagueId,
    label,
    seasonKey,
    teamCount: uniqueTeams.size,
    playerCount,
  }
}

export async function syncTeamSeasonToDb(
  ctx: ReturnType<typeof createSyncContext>,
  teamId: number,
  teamName: string,
  leagueId: number,
  leagueLabel: string,
  seasonKey: SeasonKey,
  source: StatsSource = 'manual',
): Promise<PlayerSeasonStats[]> {
  const apiSeasons = getApiSeasonsForWindow(leagueId, seasonKey)
  await syncOneTeam(
    ctx.client,
    { id: teamId, name: teamName, logo: '' },
    leagueId,
    leagueLabel,
    seasonKey,
    source,
  )
  logSync('team', `${teamId}@${leagueId}:${seasonKey}`, ctx.getRequestsUsed())

  const { getPlayersForTeam } = await import('../db/scoutDb.ts')
  return getPlayersForTeam(teamId, leagueId, leagueLabel, seasonKey)
}

export async function syncPlayerToDb(
  ctx: ReturnType<typeof createSyncContext>,
  playerId: number,
  teamId: number,
  teamName: string,
  leagueId: number,
  leagueLabel: string,
  seasonKey: SeasonKey,
  source: StatsSource = 'manual',
): Promise<PlayerSeasonStats | null> {
  const apiSeasons = getApiSeasonsForWindow(leagueId, seasonKey)
  const rows: PlayerSeasonStats[] = []

  for (const apiSeason of apiSeasons) {
    const stats = await ctx.client.fetchPlayerStatsById(playerId, apiSeason)
    for (const s of stats) {
      const enriched = {
        ...s,
        teamId,
        teamName,
        leagueId,
        leagueLabel,
      }
      upsertPlayerStat(enriched, leagueId, apiSeason, seasonKey, source)
      rows.push(enriched)
    }
  }

  upsertTeam(
    { id: teamId, name: teamName, logo: '', leagueId, leagueLabel },
    apiSeasons[apiSeasons.length - 1]!,
    seasonKey,
    source,
  )

  if (!rows.length) return null
  const merged = mergePlayerStatistics(rows)[0] ?? null
  logSync('player', String(playerId), ctx.getRequestsUsed(), `${teamId}@${leagueId}`)
  return merged ? { ...merged, teamId, teamName, leagueId, leagueLabel } : null
}

export async function syncMillonariosToDb(
  ctx: ReturnType<typeof createSyncContext>,
  seasonKey: SeasonKey,
  source: StatsSource = 'bulk',
): Promise<number> {
  const leagueId = 239
  const label = 'Colombia — Liga BetPlay'
  return syncOneTeam(
    ctx.client,
    { id: TEAM_MILLONARIOS, name: 'Millonarios', logo: '' },
    leagueId,
    label,
    seasonKey,
    source,
  )
}

export async function syncAllLeaguesToDb(
  ctx: ReturnType<typeof createSyncContext>,
  source: StatsSource = 'bulk',
): Promise<SyncLeagueResult[]> {
  const leagues = getUniqueSnapshotLeagues()
  const results: SyncLeagueResult[] = []
  for (const seasonKey of SEASON_KEYS) {
    for (const league of leagues) {
      ctx.resetRequests()
      console.log(`→ ${league.label} (${seasonKey})…`)
      const r = await syncLeagueSeasonToDb(
        ctx,
        league.id,
        league.label,
        seasonKey,
        source,
      )
      if (r) {
        console.log(
          `  ✓ ${r.teamCount} equipos · ${r.playerCount} filas · ${ctx.getRequestsUsed()} req`,
        )
        results.push(r)
      } else {
        console.warn(`  ⚠ Sin datos para ${league.label} ${seasonKey}`)
      }
    }
  }
  setMeta('last_bulk_sync', new Date().toISOString())
  return results
}

export { getUniqueSnapshotLeagues, SEASON_KEYS }
