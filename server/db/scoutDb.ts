import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { PlayerSeasonStats, ScoutTeam } from '../../src/types/index.ts'
import type { SeasonKey } from '../../src/types/scoutSnapshot.ts'
import { mergePlayerStatistics } from '../../src/services/playerMerge.ts'
import { getApiSeasonsForWindow } from '../../src/config/scoutSnapshotSeasons.ts'
import {
  hasMeaningfulStats,
  pickBestPlayerStats,
} from '../../src/utils/playerStatsPick.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '../..')

export type StatsSource = 'bulk' | 'manual' | 'live' | 'import'

export function getScoutDbPath(): string {
  const env = (process.env.SCOUT_DB_PATH ?? '').trim()
  if (env) return path.isAbsolute(env) ? env : path.join(ROOT, env)
  return path.join(ROOT, 'data', 'scout.db')
}

let dbInstance: Database.Database | null = null

export function getScoutDb(): Database.Database {
  if (dbInstance) return dbInstance
  const dbPath = getScoutDbPath()
  fs.mkdirSync(path.dirname(dbPath), { recursive: true })
  dbInstance = new Database(dbPath)
  dbInstance.pragma('journal_mode = WAL')
  dbInstance.pragma('foreign_keys = ON')
  initSchema(dbInstance)
  return dbInstance
}

export function closeScoutDb(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      team_id INTEGER NOT NULL,
      league_id INTEGER NOT NULL,
      api_season INTEGER NOT NULL,
      season_key TEXT NOT NULL,
      name TEXT NOT NULL,
      logo TEXT NOT NULL DEFAULT '',
      league_label TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL,
      PRIMARY KEY (team_id, league_id, api_season, season_key)
    );

    CREATE TABLE IF NOT EXISTS player_stats (
      player_id INTEGER NOT NULL,
      team_id INTEGER NOT NULL,
      league_id INTEGER NOT NULL,
      api_season INTEGER NOT NULL,
      season_key TEXT NOT NULL,
      stats_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      source TEXT NOT NULL DEFAULT 'bulk',
      PRIMARY KEY (player_id, team_id, league_id, api_season)
    );

    CREATE INDEX IF NOT EXISTS idx_player_stats_team
      ON player_stats(team_id, league_id, season_key);
    CREATE INDEX IF NOT EXISTS idx_player_stats_league
      ON player_stats(league_id, season_key);
    CREATE INDEX IF NOT EXISTS idx_teams_league
      ON teams(league_id, season_key);

    CREATE TABLE IF NOT EXISTS sync_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      target TEXT NOT NULL,
      at TEXT NOT NULL,
      requests_used INTEGER NOT NULL DEFAULT 0,
      detail TEXT
    );

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)
}

export function setMeta(key: string, value: string): void {
  getScoutDb()
    .prepare(
      `INSERT INTO meta (key, value) VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    )
    .run(key, value)
}

export function getMeta(key: string): string | null {
  const row = getScoutDb()
    .prepare('SELECT value FROM meta WHERE key = ?')
    .get(key) as { value: string } | undefined
  return row?.value ?? null
}

export function logSync(
  action: string,
  target: string,
  requestsUsed: number,
  detail?: string,
): void {
  getScoutDb()
    .prepare(
      `INSERT INTO sync_log (action, target, at, requests_used, detail)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(action, target, new Date().toISOString(), requestsUsed, detail ?? null)
}

export function upsertTeam(
  team: ScoutTeam,
  apiSeason: number,
  seasonKey: SeasonKey,
  source: StatsSource = 'bulk',
): void {
  void source
  getScoutDb()
    .prepare(
      `INSERT INTO teams (team_id, league_id, api_season, season_key, name, logo, league_label, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(team_id, league_id, api_season, season_key) DO UPDATE SET
         name = excluded.name,
         logo = excluded.logo,
         league_label = excluded.league_label,
         updated_at = excluded.updated_at`,
    )
    .run(
      team.id,
      team.leagueId,
      apiSeason,
      seasonKey,
      team.name,
      team.logo ?? '',
      team.leagueLabel,
      new Date().toISOString(),
    )
}

export function upsertPlayerStat(
  stats: PlayerSeasonStats,
  leagueId: number,
  apiSeason: number,
  seasonKey: SeasonKey,
  source: StatsSource = 'bulk',
): void {
  getScoutDb()
    .prepare(
      `INSERT INTO player_stats
         (player_id, team_id, league_id, api_season, season_key, stats_json, updated_at, source)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(player_id, team_id, league_id, api_season) DO UPDATE SET
         season_key = excluded.season_key,
         stats_json = excluded.stats_json,
         updated_at = excluded.updated_at,
         source = CASE
           WHEN excluded.source = 'manual' THEN 'manual'
           WHEN player_stats.source = 'manual' THEN 'manual'
           ELSE excluded.source
         END`,
    )
    .run(
      stats.playerId,
      stats.teamId,
      leagueId,
      apiSeason,
      seasonKey,
      JSON.stringify(stats),
      new Date().toISOString(),
      source,
    )
}

export function getTeamsByLeagues(
  leagueIds: number[],
  seasonKey: SeasonKey,
): ScoutTeam[] {
  if (!leagueIds.length) return []
  const apiSeasons = new Set<number>()
  for (const id of leagueIds) {
    for (const s of getApiSeasonsForWindow(id, seasonKey)) apiSeasons.add(s)
  }
  const placeholders = leagueIds.map(() => '?').join(',')
  const seasonPlaceholders = [...apiSeasons].map(() => '?').join(',')
  const rows = getScoutDb()
    .prepare(
      `SELECT DISTINCT team_id, league_id, name, logo, league_label
       FROM teams
       WHERE league_id IN (${placeholders})
         AND season_key = ?
         AND api_season IN (${seasonPlaceholders})`,
    )
    .all(...leagueIds, seasonKey, ...apiSeasons) as Array<{
    team_id: number
    league_id: number
    name: string
    logo: string
    league_label: string
  }>

  const map = new Map<number, ScoutTeam>()
  for (const r of rows) {
    if (!map.has(r.team_id)) {
      map.set(r.team_id, {
        id: r.team_id,
        name: r.name,
        logo: r.logo,
        leagueId: r.league_id,
        leagueLabel: r.league_label,
      })
    }
  }
  return [...map.values()].sort(
    (a, b) =>
      a.leagueLabel.localeCompare(b.leagueLabel, 'es') ||
      a.name.localeCompare(b.name, 'es'),
  )
}

function loadRawStatsForTeam(
  teamId: number,
  leagueId: number,
  seasonKey: SeasonKey,
): PlayerSeasonStats[] {
  const apiSeasons = getApiSeasonsForWindow(leagueId, seasonKey)
  const placeholders = apiSeasons.map(() => '?').join(',')
  const rows = getScoutDb()
    .prepare(
      `SELECT stats_json FROM player_stats
       WHERE team_id = ? AND league_id = ? AND season_key = ?
         AND api_season IN (${placeholders})`,
    )
    .all(teamId, leagueId, seasonKey, ...apiSeasons) as Array<{ stats_json: string }>

  const byPlayer = new Map<number, PlayerSeasonStats[]>()
  for (const r of rows) {
    const stat = JSON.parse(r.stats_json) as PlayerSeasonStats
    if (!byPlayer.has(stat.playerId)) byPlayer.set(stat.playerId, [])
    byPlayer.get(stat.playerId)!.push(stat)
  }

  const merged: PlayerSeasonStats[] = []
  for (const group of byPlayer.values()) {
    merged.push(...mergePlayerStatistics(group))
  }
  return merged
}

export function getPlayersForTeam(
  teamId: number,
  leagueId: number,
  leagueLabel: string,
  seasonKey: SeasonKey,
): PlayerSeasonStats[] {
  return loadRawStatsForTeam(teamId, leagueId, seasonKey).map((p) => ({
    ...p,
    leagueId,
    leagueLabel,
  }))
}

export function getPlayersForTeams(
  entries: Array<{ teamId: number; leagueId: number; leagueLabel: string }>,
  seasonKey: SeasonKey,
): PlayerSeasonStats[] {
  const results: PlayerSeasonStats[] = []
  for (const e of entries) {
    results.push(...getPlayersForTeam(e.teamId, e.leagueId, e.leagueLabel, seasonKey))
  }
  return results
}

export function getPlayerById(
  playerId: number,
  teamId: number,
  leagueId: number,
  leagueLabel: string,
  seasonKey: SeasonKey,
): PlayerSeasonStats | null {
  const players = getPlayersForTeam(teamId, leagueId, leagueLabel, seasonKey)
  return players.find((p) => p.playerId === playerId) ?? null
}

export interface PlayerStatsRow {
  stats: PlayerSeasonStats
  seasonKey: SeasonKey
  apiSeason: number
}

export function getPlayerStatsRawAcrossSeasons(
  playerId: number,
  teamId: number,
  leagueId: number,
): PlayerStatsRow[] {
  const rows = getScoutDb()
    .prepare(
      `SELECT stats_json, season_key, api_season FROM player_stats
       WHERE player_id = ? AND team_id = ? AND league_id = ?
       ORDER BY api_season DESC`,
    )
    .all(playerId, teamId, leagueId) as Array<{
    stats_json: string
    season_key: string
    api_season: number
  }>

  return rows.map((r) => ({
    stats: JSON.parse(r.stats_json) as PlayerSeasonStats,
    seasonKey: r.season_key as SeasonKey,
    apiSeason: r.api_season,
  }))
}

export function getPlayerBestAcrossSeasons(
  playerId: number,
  teamId: number,
  leagueId: number,
  leagueLabel: string,
  preferredSeasonKey: SeasonKey,
): { player: PlayerSeasonStats; row: PlayerStatsRow } | null {
  const raw = getPlayerStatsRawAcrossSeasons(playerId, teamId, leagueId)
  if (!raw.length) return null

  const preferredWindow = raw.filter((r) => r.seasonKey === preferredSeasonKey)
  const preferredMerged = mergePlayerStatistics(
    preferredWindow.map((r) => r.stats),
  )
  const preferredBest = pickBestPlayerStats(preferredMerged)
  if (preferredBest && hasMeaningfulStats(preferredBest)) {
    const row =
      preferredWindow.find((r) => r.stats.playerId === preferredBest.playerId) ??
      preferredWindow[0]!
    return {
      player: { ...preferredBest, leagueId, leagueLabel },
      row,
    }
  }

  const best = pickBestPlayerStats(raw.map((r) => r.stats))
  if (!best) return null
  const row =
    raw.find(
      (r) =>
        r.stats.playerId === best.playerId &&
        (r.stats.minutes === best.minutes || r.stats.appearances === best.appearances),
    ) ?? raw[0]!
  return {
    player: { ...best, leagueId, leagueLabel },
    row,
  }
}

export function getManualPlayerPatches(): PlayerSeasonStats[] {
  const rows = getScoutDb()
    .prepare(
      `SELECT stats_json FROM player_stats WHERE source = 'manual'
       ORDER BY updated_at DESC`,
    )
    .all() as Array<{ stats_json: string }>
  return rows.map((r) => JSON.parse(r.stats_json) as PlayerSeasonStats)
}

export interface LeagueExportGroup {
  leagueId: number
  label: string
  seasonKey: SeasonKey
  apiSeasons: number[]
  teams: ScoutTeam[]
  players: PlayerSeasonStats[]
}

export function getLeagueExportGroups(): LeagueExportGroup[] {
  const db = getScoutDb()
  const leagueRows = db
    .prepare(
      `SELECT DISTINCT league_id, league_label, season_key
       FROM teams ORDER BY league_label, season_key`,
    )
    .all() as Array<{
    league_id: number
    league_label: string
    season_key: SeasonKey
  }>

  const groups: LeagueExportGroup[] = []
  for (const row of leagueRows) {
    const apiSeasonRows = db
      .prepare(
        `SELECT DISTINCT api_season FROM teams
         WHERE league_id = ? AND season_key = ? ORDER BY api_season`,
      )
      .all(row.league_id, row.season_key) as Array<{ api_season: number }>

    const teams = getTeamsByLeagues([row.league_id], row.season_key)
    const teamEntries = teams.map((t) => ({
      teamId: t.id,
      leagueId: row.league_id,
      leagueLabel: row.league_label,
    }))
    groups.push({
      leagueId: row.league_id,
      label: row.league_label,
      seasonKey: row.season_key,
      apiSeasons: apiSeasonRows.map((r) => r.api_season),
      teams,
      players: getPlayersForTeams(teamEntries, row.season_key),
    })
  }
  return groups
}

export function getMillonariosExport(seasonKey: SeasonKey): PlayerSeasonStats[] {
  const rows = getScoutDb()
    .prepare(
      `SELECT stats_json FROM player_stats
       WHERE team_id = 1125 AND season_key = ?`,
    )
    .all(seasonKey) as Array<{ stats_json: string }>

  const byPlayer = new Map<number, PlayerSeasonStats[]>()
  for (const r of rows) {
    const stat = JSON.parse(r.stats_json) as PlayerSeasonStats
    if (!byPlayer.has(stat.playerId)) byPlayer.set(stat.playerId, [])
    byPlayer.get(stat.playerId)!.push(stat)
  }
  const merged: PlayerSeasonStats[] = []
  for (const group of byPlayer.values()) {
    merged.push(...mergePlayerStatistics(group))
  }
  return merged
}

export function clearLeagueSeason(
  leagueId: number,
  seasonKey: SeasonKey,
): void {
  const db = getScoutDb()
  db.prepare(
    `DELETE FROM player_stats WHERE league_id = ? AND season_key = ?`,
  ).run(leagueId, seasonKey)
  db.prepare(
    `DELETE FROM teams WHERE league_id = ? AND season_key = ?`,
  ).run(leagueId, seasonKey)
}
