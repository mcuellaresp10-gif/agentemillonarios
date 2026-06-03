/**
 * Sync bulk scouting → SQLite + export JSON.
 * Uso: npm run sync:scout [-- --force]
 */
import { loadApiKeyFromEnv } from '../server/services/scoutApiClient.ts'
import {
  createSyncContext,
  syncAllLeaguesToDb,
  syncMillonariosToDb,
  SEASON_KEYS,
} from '../server/services/scoutSyncCore.ts'
import { execSync } from 'node:child_process'

const ROOT = process.cwd()
const force = process.argv.includes('--force')

async function main() {
  const apiKey = loadApiKeyFromEnv(ROOT)
  const delayMs = Number(process.env.SYNC_DELAY_MS) || 80
  const ctx = createSyncContext(apiKey, delayMs)

  console.log('Sync scouting → SQLite')
  if (force) console.log('Modo --force: regenerando ligas')

  const results = await syncAllLeaguesToDb(ctx, 'bulk')
  console.log(`\nLigas sincronizadas: ${results.length}`)

  console.log('\n=== Plantilla Millonarios ===')
  for (const seasonKey of SEASON_KEYS) {
    ctx.resetRequests()
    const n = await syncMillonariosToDb(ctx, seasonKey, 'bulk')
    console.log(`  ✓ ${seasonKey}: ${n} filas`)
  }

  console.log('\n=== Export JSON ===')
  execSync('npm run export:scout', { cwd: ROOT, stdio: 'inherit' })

  console.log('\n--- Resumen ---')
  console.log(`  Requests API (última liga): ${ctx.getRequestsUsed()}`)
  console.log(`  Archivos liga en SQLite: ${results.length}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
