/**
 * Sync esporádico de un jugador.
 * npm run sync:player -- --id=123 --team=438 --league=128 --season-key=2025-2026
 * npm run sync:player -- --search=Marchiori --league=128 --season-key=2025-2026
 */
import { loadApiKeyFromEnv } from '../server/services/scoutApiClient.ts'
import {
  createSyncContext,
  syncPlayerToDb,
} from '../server/services/scoutSyncCore.ts'
import { getApiSeason } from '../src/config/scoutSnapshotSeasons.ts'
import type { SeasonKey } from '../src/types/scoutSnapshot.ts'
import { defaultSeasonKey } from '../src/config/scoutSnapshotSeasons.ts'

function arg(name: string): string | undefined {
  const pref = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(pref))
  return hit?.slice(pref.length)
}

async function main() {
  const root = process.cwd()
  const apiKey = loadApiKeyFromEnv(root)
  const ctx = createSyncContext(apiKey, 80)

  const seasonKey = (arg('season-key') ?? defaultSeasonKey()) as SeasonKey
  const leagueId = Number(arg('league') ?? 128)
  const teamId = Number(arg('team') ?? 0)
  const playerId = Number(arg('id') ?? 0)
  const search = arg('search')
  const leagueLabel = arg('league-label') ?? `Liga ${leagueId}`

  if (search && !playerId) {
    const apiSeason = getApiSeason(leagueId, seasonKey)
    const hits = await ctx.client.searchPlayers(search, leagueId, apiSeason)
    if (!hits.length) {
      console.error(`Sin resultados para "${search}"`)
      process.exit(1)
    }
    const p = hits[0]!
    console.log(`Encontrado: ${p.name} (id=${p.playerId}, team=${p.teamId})`)
    const result = await syncPlayerToDb(
      ctx,
      p.playerId,
      teamId || p.teamId,
      p.teamName,
      leagueId,
      leagueLabel,
      seasonKey,
      'manual',
    )
    console.log(result ? `✓ Stats: ${result.appearances} pj, rating ${result.ratingAvg}` : 'Sin stats')
    return
  }

  if (!playerId || !teamId) {
    console.error('Uso: --id=PLAYER --team=TEAM [--league=128] [--season-key=2025-2026]')
    console.error('  o: --search=Nombre --league=128')
    process.exit(1)
  }

  const teamName = arg('team-name') ?? `Team ${teamId}`
  const result = await syncPlayerToDb(
    ctx,
    playerId,
    teamId,
    teamName,
    leagueId,
    leagueLabel,
    seasonKey,
    'manual',
  )
  console.log(result ? `✓ ${result.name}: ${result.appearances} pj` : 'Sin stats en API')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
