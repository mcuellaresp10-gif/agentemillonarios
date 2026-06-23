/**
 * Sync puntual de una sola liga (todas las temporadas).
 * Uso: npx tsx --tsconfig tsconfig.app.json scripts/sync-one-league.ts --league=235 --label="Rusia — Premier League"
 */
import { loadApiKeyFromEnv } from '../server/services/scoutApiClient.ts'
import {
  createSyncContext,
  syncLeagueSeasonToDb,
} from '../server/services/scoutSyncCore.ts'
import { SEASON_KEYS } from '../src/types/scoutSnapshot.ts'

function arg(name: string): string | undefined {
  const pref = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(pref))
  return hit?.slice(pref.length)
}

async function main() {
  const apiKey = loadApiKeyFromEnv(process.cwd())
  const ctx = createSyncContext(apiKey, 80)

  const leagueId = Number(arg('league'))
  const label = arg('label') ?? `Liga ${leagueId}`

  if (!leagueId) {
    console.error('Uso: --league=ID [--label="Nombre"]')
    process.exit(1)
  }

  for (const seasonKey of SEASON_KEYS) {
    ctx.resetRequests()
    console.log(`→ ${label} (${seasonKey})…`)
    const r = await syncLeagueSeasonToDb(ctx, leagueId, label, seasonKey, 'manual')
    if (r) {
      console.log(`  ✓ ${r.teamCount} equipos · ${r.playerCount} filas · ${ctx.getRequestsUsed()} req`)
    } else {
      console.log('  ✗ sin equipos para esta temporada')
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
