/**
 * Sync esporádico de plantilla completa.
 * npm run sync:team -- --team=438 --league=128 --season-key=2025-2026 --name=Velez
 */
import { loadApiKeyFromEnv } from '../server/services/scoutApiClient.ts'
import {
  createSyncContext,
  syncTeamSeasonToDb,
} from '../server/services/scoutSyncCore.ts'
import type { SeasonKey } from '../src/types/scoutSnapshot.ts'
import { defaultSeasonKey } from '../src/config/scoutSnapshotSeasons.ts'

function arg(name: string): string | undefined {
  const pref = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(pref))
  return hit?.slice(pref.length)
}

async function main() {
  const apiKey = loadApiKeyFromEnv(process.cwd())
  const ctx = createSyncContext(apiKey, 80)

  const teamId = Number(arg('team'))
  const leagueId = Number(arg('league'))
  const seasonKey = (arg('season-key') ?? defaultSeasonKey()) as SeasonKey
  const teamName = arg('name') ?? `Team ${teamId}`
  const leagueLabel = arg('league-label') ?? `Liga ${leagueId}`

  if (!teamId || !leagueId) {
    console.error('Uso: --team=ID --league=ID [--name=Equipo] [--season-key=2025-2026]')
    process.exit(1)
  }

  console.log(`→ ${teamName} (${seasonKey})`)
  const players = await syncTeamSeasonToDb(
    ctx,
    teamId,
    teamName,
    leagueId,
    leagueLabel,
    seasonKey,
    'manual',
  )
  console.log(`✓ ${players.length} jugadores (${ctx.getRequestsUsed()} requests)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
