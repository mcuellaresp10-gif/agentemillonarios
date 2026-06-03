/**
 * Genera public/data/snapshot/ desde SQLite.
 * Uso: npm run export:scout
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  getLeagueExportGroups,
  getManualPlayerPatches,
  getMeta,
  getMillonariosExport,
  setMeta,
} from '../server/db/scoutDb.ts'
import type {
  MillonariosSnapshot,
  ScoutLeagueSnapshot,
  ScoutSnapshotManifest,
} from '../src/types/scoutSnapshot.ts'
import { SEASON_KEYS } from '../src/types/scoutSnapshot.ts'
import { getApiSeason } from '../src/config/scoutSnapshotSeasons.ts'

const ROOT = process.cwd()
const OUT_DIR = join(ROOT, 'public', 'data', 'snapshot')
const LEAGUES_DIR = join(OUT_DIR, 'leagues')
const MILL_DIR = join(OUT_DIR, 'millonarios')
const PATCHES_DIR = join(OUT_DIR, 'patches', 'players')

function main() {
  mkdirSync(LEAGUES_DIR, { recursive: true })
  mkdirSync(MILL_DIR, { recursive: true })
  mkdirSync(PATCHES_DIR, { recursive: true })

  const generatedAt = new Date().toISOString()
  const groups = getLeagueExportGroups()
  const manifestLeagues: ScoutSnapshotManifest['leagues'] = []

  for (const g of groups) {
    const relPath = `leagues/${g.leagueId}-${g.seasonKey}.json`
    const primaryApiSeason = g.apiSeasons[g.apiSeasons.length - 1] ?? getApiSeason(g.leagueId, g.seasonKey)
    const snap: ScoutLeagueSnapshot = {
      version: 1,
      leagueId: g.leagueId,
      label: g.label,
      seasonKey: g.seasonKey,
      apiSeason: primaryApiSeason,
      generatedAt,
      teams: g.teams,
      players: g.players,
    }
    writeFileSync(join(OUT_DIR, relPath), JSON.stringify(snap))
    manifestLeagues.push({
      leagueId: g.leagueId,
      label: g.label,
      short: g.label.split('—')[0]?.trim().slice(0, 3).toUpperCase() ?? String(g.leagueId),
      seasonKey: g.seasonKey,
      apiSeason: primaryApiSeason,
      path: relPath,
      teamCount: g.teams.length,
      playerCount: g.players.length,
    })
    console.log(`  ✓ ${g.label} ${g.seasonKey}: ${g.players.length} jugadores`)
  }

  const manifestMill: ScoutSnapshotManifest['millonarios'] = []
  for (const seasonKey of SEASON_KEYS) {
    const players = getMillonariosExport(seasonKey)
    if (!players.length) continue
    const relPath = `millonarios/${seasonKey}.json`
    const snap: MillonariosSnapshot = {
      version: 1,
      seasonKey,
      apiSeason: getApiSeason(239, seasonKey),
      generatedAt,
      players,
    }
    writeFileSync(join(MILL_DIR, `${seasonKey}.json`), JSON.stringify(snap))
    manifestMill.push({
      seasonKey,
      apiSeason: snap.apiSeason,
      path: relPath,
      playerCount: players.length,
    })
    console.log(`  ✓ Millonarios ${seasonKey}: ${players.length} jugadores`)
  }

  const patches = getManualPlayerPatches()
  for (const p of patches) {
    writeFileSync(
      join(PATCHES_DIR, `${p.playerId}.json`),
      JSON.stringify({ version: 1, generatedAt, player: p }),
    )
  }
  if (patches.length) console.log(`  ✓ ${patches.length} patches manuales`)

  const manifest: ScoutSnapshotManifest = {
    version: 1,
    generatedAt,
    seasonKeys: [...SEASON_KEYS],
    leagues: manifestLeagues,
    millonarios: manifestMill,
  }
  writeFileSync(join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2))
  setMeta('last_export_at', generatedAt)

  console.log(`\nExport completo → ${OUT_DIR}`)
  console.log(`  last_bulk_sync: ${getMeta('last_bulk_sync') ?? '—'}`)
}

main()
