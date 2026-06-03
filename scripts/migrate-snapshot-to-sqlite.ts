/**
 * Importa JSON estático existente → SQLite (one-shot).
 */
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  getScoutDb,
  upsertPlayerStat,
  upsertTeam,
  setMeta,
  logSync,
} from '../server/db/scoutDb.ts'
import type {
  MillonariosSnapshot,
  ScoutLeagueSnapshot,
  ScoutSnapshotManifest,
} from '../src/types/scoutSnapshot.ts'

const ROOT = process.cwd()
const SNAPSHOT_DIR = join(ROOT, 'public', 'data', 'snapshot')

function main() {
  const manifestPath = join(SNAPSHOT_DIR, 'manifest.json')
  if (!existsSync(manifestPath)) {
    console.error('No existe manifest.json — corre npm run sync:scout primero')
    process.exit(1)
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as ScoutSnapshotManifest
  getScoutDb()

  let teams = 0
  let players = 0

  for (const entry of manifest.leagues) {
    const filePath = join(SNAPSHOT_DIR, entry.path)
    if (!existsSync(filePath)) continue
    const snap = JSON.parse(readFileSync(filePath, 'utf8')) as ScoutLeagueSnapshot
    for (const t of snap.teams) {
      upsertTeam(t, snap.apiSeason, snap.seasonKey, 'import')
      teams++
    }
    for (const p of snap.players) {
      upsertPlayerStat(p, snap.leagueId, snap.apiSeason, snap.seasonKey, 'import')
      players++
    }
    console.log(`  ✓ ${entry.label} ${entry.seasonKey}: ${snap.players.length} jugadores`)
  }

  for (const entry of manifest.millonarios) {
    const filePath = join(SNAPSHOT_DIR, entry.path)
    if (!existsSync(filePath)) continue
    const snap = JSON.parse(readFileSync(filePath, 'utf8')) as MillonariosSnapshot
    for (const p of snap.players) {
      upsertPlayerStat(p, 239, snap.apiSeason, snap.seasonKey, 'import')
      players++
    }
    console.log(`  ✓ Millonarios ${entry.seasonKey}: ${snap.players.length} jugadores`)
  }

  setMeta('last_import_from_json', new Date().toISOString())
  logSync('migrate', 'json-to-sqlite', 0, `${teams} teams, ${players} player rows`)
  console.log(`\nMigración completa: ${players} filas de jugador en SQLite`)
}

main()
