/**
 * Genera public/data/snapshot/ desde API-Football (scouting híbrido).
 * Uso: npm run sync:scout [-- --force]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { TEAM_MILLONARIOS } from '../src/config/constants.ts'
import {
  getApiSeason,
  getUniqueSnapshotLeagues,
} from '../src/config/scoutSnapshotSeasons.ts'
import { mapPlayerStatistics } from '../src/services/mappers.ts'
import { mergePlayerStatistics } from '../src/services/playerMerge.ts'
import type { ApiResponse, ApiTeam, PlayerSeasonStats, ScoutTeam } from '../src/types/index.ts'
import type {
  MillonariosSnapshot,
  ScoutLeagueSnapshot,
  ScoutSnapshotManifest,
  ScoutSnapshotManifestLeague,
  ScoutSnapshotManifestMillonarios,
  SeasonKey,
} from '../src/types/scoutSnapshot.ts'
import { SEASON_KEYS } from '../src/types/scoutSnapshot.ts'

const ROOT = process.cwd()
const OUT_DIR = join(ROOT, 'public', 'data', 'snapshot')
const LEAGUES_DIR = join(OUT_DIR, 'leagues')
const MILL_DIR = join(OUT_DIR, 'millonarios')
const MANIFEST_PATH = join(OUT_DIR, 'manifest.json')

const force = process.argv.includes('--force')
const delayMs = Number(process.env.SYNC_DELAY_MS) || 80

function loadEnv(): Record<string, string> {
  const env: Record<string, string> = { ...process.env } as Record<string, string>
  for (const file of ['.env.local', '.env']) {
    try {
      const raw = readFileSync(join(ROOT, file), 'utf8')
      for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^([^#=]+)=(.*)$/)
        if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
      }
    } catch {
      /* missing file */
    }
  }
  return env
}

const env = loadEnv()
const API_KEY = env.API_FOOTBALL_KEY
const BASE_URL = (env.API_FOOTBALL_BASE_URL ?? 'https://v3.football.api-sports.io').replace(
  /\/$/,
  '',
)

if (!API_KEY || API_KEY === 'your_api_football_key_here') {
  console.error('Falta API_FOOTBALL_KEY en .env o .env.local')
  process.exit(1)
}

let requestCount = 0

async function apiGet<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)]),
  ).toString()
  const url = `${BASE_URL}/${path}${qs ? `?${qs}` : ''}`
  requestCount++
  const res = await fetch(url, {
    headers: { 'x-apisports-key': API_KEY! },
  })
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
  const json = (await res.json()) as { response: T; errors?: unknown }
  if (json.errors && Object.keys(json.errors as object).length > 0) {
    console.warn(`  ⚠ ${path}`, json.errors)
  }
  return json.response
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function leagueFileName(leagueId: number, seasonKey: SeasonKey): string {
  return `${leagueId}-${seasonKey}.json`
}

function millFileName(seasonKey: SeasonKey): string {
  return `${seasonKey}.json`
}

async function fetchTeams(leagueId: number, apiSeason: number): Promise<ApiTeam[]> {
  const raw = await apiGet<{ team: ApiTeam }[]>('teams', { league: leagueId, season: apiSeason })
  await sleep(delayMs)
  return raw.map((t) => t.team)
}

async function fetchTeamPlayers(
  teamId: number,
  teamName: string,
  apiSeason: number,
  leagueId: number,
  leagueLabel: string,
): Promise<PlayerSeasonStats[]> {
  const data = await apiGet<unknown[]>('players', { team: teamId, season: apiSeason })
  await sleep(delayMs)
  const mapped = mergePlayerStatistics(
    mapPlayerStatistics({ response: data } as ApiResponse<unknown[]>),
  )
  return mapped.map((p) => ({
    ...p,
    teamId,
    teamName,
    leagueId,
    leagueLabel,
  }))
}

async function syncLeagueSeason(
  leagueId: number,
  label: string,
  short: string,
  seasonKey: SeasonKey,
  generatedAt: string,
): Promise<ScoutSnapshotManifestLeague | null> {
  const apiSeason = getApiSeason(leagueId, seasonKey)
  const relPath = `leagues/${leagueFileName(leagueId, seasonKey)}`
  const outPath = join(OUT_DIR, relPath)

  if (!force && existsSync(outPath)) {
    try {
      const existing = JSON.parse(readFileSync(outPath, 'utf8')) as ScoutLeagueSnapshot
      console.log(`  ↷ omitido (existe): ${label} ${seasonKey}`)
      return {
        leagueId,
        label,
        short,
        seasonKey,
        apiSeason: existing.apiSeason,
        path: relPath,
        teamCount: existing.teams.length,
        playerCount: existing.players.length,
      }
    } catch {
      /* regenerate corrupt file */
    }
  }

  console.log(`→ ${label} (${seasonKey}, API season ${apiSeason})`)
  const apiTeams = await fetchTeams(leagueId, apiSeason)
  if (!apiTeams.length) {
    console.warn(`  ⚠ Sin equipos para liga ${leagueId} season ${apiSeason}`)
    return null
  }

  const teams: ScoutTeam[] = apiTeams.map((t) => ({
    id: t.id,
    name: t.name,
    logo: t.logo,
    leagueId,
    leagueLabel: label,
  }))

  const players: PlayerSeasonStats[] = []
  let ti = 0
  for (const team of apiTeams) {
    ti++
    process.stdout.write(`\r  equipos ${ti}/${apiTeams.length} · ${team.name.slice(0, 28).padEnd(28)}`)
    try {
      const rows = await fetchTeamPlayers(
        team.id,
        team.name,
        apiSeason,
        leagueId,
        label,
      )
      players.push(...rows)
    } catch (e) {
      console.warn(`\n  ⚠ Error ${team.name}:`, e instanceof Error ? e.message : e)
    }
  }
  console.log(`\n  ✓ ${teams.length} equipos · ${players.length} jugadores`)

  const snapshot: ScoutLeagueSnapshot = {
    version: 1,
    leagueId,
    label,
    seasonKey,
    apiSeason,
    generatedAt,
    teams,
    players,
  }

  writeFileSync(outPath, JSON.stringify(snapshot))
  return {
    leagueId,
    label,
    short,
    seasonKey,
    apiSeason,
    path: relPath,
    teamCount: teams.length,
    playerCount: players.length,
  }
}

async function syncMillonarios(
  seasonKey: SeasonKey,
  generatedAt: string,
): Promise<ScoutSnapshotManifestMillonarios | null> {
  const apiSeason = getApiSeason(239, seasonKey)
  const relPath = `millonarios/${millFileName(seasonKey)}`
  const outPath = join(OUT_DIR, relPath)

  if (!force && existsSync(outPath)) {
    try {
      const existing = JSON.parse(readFileSync(outPath, 'utf8')) as MillonariosSnapshot
      console.log(`  ↷ omitido Millonarios ${seasonKey}`)
      return {
        seasonKey,
        apiSeason: existing.apiSeason,
        path: relPath,
        playerCount: existing.players.length,
      }
    } catch {
      /* regenerate */
    }
  }

  console.log(`→ Millonarios plantilla (${seasonKey}, API season ${apiSeason})`)
  const players = await fetchTeamPlayers(
    TEAM_MILLONARIOS,
    'Millonarios',
    apiSeason,
    239,
    'Colombia — Liga BetPlay',
  )

  const snapshot: MillonariosSnapshot = {
    version: 1,
    seasonKey,
    apiSeason,
    generatedAt,
    players,
  }

  writeFileSync(outPath, JSON.stringify(snapshot))
  console.log(`  ✓ ${players.length} jugadores`)
  return {
    seasonKey,
    apiSeason,
    path: relPath,
    playerCount: players.length,
  }
}

async function main() {
  mkdirSync(LEAGUES_DIR, { recursive: true })
  mkdirSync(MILL_DIR, { recursive: true })

  const generatedAt = new Date().toISOString()
  const leagues = getUniqueSnapshotLeagues()
  const manifestLeagues: ScoutSnapshotManifestLeague[] = []

  console.log(`Sync scouting snapshot · ${leagues.length} ligas · ${SEASON_KEYS.length} temporadas`)
  if (force) console.log('Modo --force: regenerando todo')

  for (const seasonKey of SEASON_KEYS) {
    console.log(`\n=== Temporada ${seasonKey} ===`)
    for (const league of leagues) {
      const entry = await syncLeagueSeason(
        league.id,
        league.label,
        league.short,
        seasonKey,
        generatedAt,
      )
      if (entry) manifestLeagues.push(entry)
    }
  }

  console.log('\n=== Plantilla Millonarios ===')
  const manifestMill: ScoutSnapshotManifestMillonarios[] = []
  for (const seasonKey of SEASON_KEYS) {
    const entry = await syncMillonarios(seasonKey, generatedAt)
    if (entry) manifestMill.push(entry)
  }

  const manifest: ScoutSnapshotManifest = {
    version: 1,
    generatedAt,
    seasonKeys: [...SEASON_KEYS],
    leagues: manifestLeagues,
    millonarios: manifestMill,
  }

  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2))

  const totalPlayers = manifestLeagues.reduce((s, l) => s + l.playerCount, 0)
  console.log('\n--- Resumen ---')
  console.log(`  Requests API: ${requestCount}`)
  console.log(`  Archivos liga: ${manifestLeagues.length}`)
  console.log(`  Jugadores (ligas): ${totalPlayers}`)
  console.log(`  Manifest: ${MANIFEST_PATH}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
