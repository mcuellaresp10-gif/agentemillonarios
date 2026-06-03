import { getPlayerStatisticsById } from '@/services/apiFootball'
import { resolveScoutPlayer } from '@/services/scoutCatalogResolver'
import { fetchScoutPlayerDetailFromDb, refreshPlayerStats } from '@/services/scoutApi'
import { getSnapshotTeamPlayers } from '@/services/snapshotStore'
import { seasonKeyLabel } from '@/config/scoutSnapshotSeasons'
import type { PlayerSeasonStats } from '@/types'
import type { SeasonKey, StatsDisplaySource } from '@/types/scoutSnapshot'
import { hasMeaningfulStats, pickBestPlayerStats } from '@/utils/playerStatsPick'

export type { StatsDisplaySource } from '@/types/scoutSnapshot'

export interface ResolvedScoutPlayer {
  player: PlayerSeasonStats
  source: StatsDisplaySource
}

const PRIOR_WINDOW: Partial<Record<SeasonKey, SeasonKey>> = {
  '2025-2026': '2024-2025',
}

const LIVE_API_SEASONS = [2025, 2024, 2026] as const

export function statsSourceLabel(
  source: StatsDisplaySource,
  preferredSeasonKey: SeasonKey,
): string {
  switch (source.kind) {
    case 'window':
      return ''
    case 'priorWindow':
      return `Sin minutos en ${seasonKeyLabel(preferredSeasonKey)}. Mostrando estadísticas de ${seasonKeyLabel(source.seasonKey)}.`
    case 'apiSeason':
      return `Sin minutos en ${seasonKeyLabel(preferredSeasonKey)}. Mostrando estadísticas de la temporada API ${source.apiSeason}.`
    case 'live':
      return `Datos obtenidos en vivo de API-Football.`
  }
}

function mergeShell(
  shell: PlayerSeasonStats | null | undefined,
  stats: PlayerSeasonStats,
): PlayerSeasonStats {
  if (!shell) return stats
  return {
    ...stats,
    name: shell.name || stats.name,
    photo: shell.photo || stats.photo,
    teamName: shell.teamName || stats.teamName,
    leagueId: shell.leagueId ?? stats.leagueId,
    leagueLabel: shell.leagueLabel ?? stats.leagueLabel,
  }
}

async function resolveFromWindow(
  seasonKey: SeasonKey,
  playerId: number,
  teamId: number,
  meta: { leagueId: number; leagueLabel: string },
  liveFallback: () => Promise<PlayerSeasonStats | null>,
): Promise<ResolvedScoutPlayer | null> {
  const player = await resolveScoutPlayer(
    seasonKey,
    playerId,
    teamId,
    meta,
    liveFallback,
  )
  if (!player || !hasMeaningfulStats(player)) return null
  return { player, source: { kind: 'window', seasonKey } }
}

async function fetchLiveByPlayerId(
  playerId: number,
  teamId: number,
): Promise<{ player: PlayerSeasonStats; apiSeason: number } | null> {
  const rows: Array<{ player: PlayerSeasonStats; apiSeason: number }> = []
  for (const apiSeason of LIVE_API_SEASONS) {
    try {
      const stats = await getPlayerStatisticsById(playerId, apiSeason, teamId)
      for (const s of stats) {
        rows.push({ player: s, apiSeason })
      }
    } catch {
      /* siguiente temporada */
    }
  }
  const best = pickBestPlayerStats(rows.map((r) => r.player))
  if (!best || !hasMeaningfulStats(best)) return null
  const match =
    rows.find(
      (r) =>
        r.player.playerId === best.playerId &&
        (r.player.minutes === best.minutes || r.player.appearances === best.appearances),
    ) ?? rows[0]!
  return { player: best, apiSeason: match.apiSeason }
}

export async function resolveScoutPlayerWithHistory(
  playerId: number,
  teamId: number,
  meta: { leagueId: number; leagueLabel: string },
  preferredSeasonKey: SeasonKey,
  liveTeamFallback: () => Promise<PlayerSeasonStats | null>,
): Promise<ResolvedScoutPlayer | null> {
  let shell: PlayerSeasonStats | null = null

  const fromDb = await fetchScoutPlayerDetailFromDb(
    playerId,
    teamId,
    meta.leagueId,
    meta.leagueLabel,
    preferredSeasonKey,
  )
  if (fromDb) {
    shell = fromDb.player
    if (hasMeaningfulStats(fromDb.player)) {
      const source =
        fromDb.statsDisplay ??
        ({ kind: 'window', seasonKey: preferredSeasonKey } satisfies StatsDisplaySource)
      return { player: fromDb.player, source }
    }
  }

  const fromSnap = await getSnapshotTeamPlayers(
    preferredSeasonKey,
    teamId,
    meta.leagueId,
    meta.leagueLabel,
  )
  const fromPreferred = fromSnap?.find((p) => p.playerId === playerId) ?? null
  if (fromPreferred) shell = mergeShell(shell, fromPreferred)
  if (fromPreferred && hasMeaningfulStats(fromPreferred)) {
    return { player: fromPreferred, source: { kind: 'window', seasonKey: preferredSeasonKey } }
  }

  const priorKey = PRIOR_WINDOW[preferredSeasonKey]
  if (priorKey) {
    const fromPrior = await resolveFromWindow(
      priorKey,
      playerId,
      teamId,
      meta,
      liveTeamFallback,
    )
    if (fromPrior) {
      return {
        player: mergeShell(shell, fromPrior.player),
        source: { kind: 'priorWindow', seasonKey: priorKey },
      }
    }
  }

  const fetched = await refreshPlayerStats(
    playerId,
    teamId,
    meta.leagueId,
    preferredSeasonKey,
    shell?.teamName,
    meta.leagueLabel,
  )
  if (fetched) shell = mergeShell(shell, fetched)
  if (fetched && hasMeaningfulStats(fetched)) {
    return { player: fetched, source: { kind: 'window', seasonKey: preferredSeasonKey } }
  }

  const live = await fetchLiveByPlayerId(playerId, teamId)
  if (live) {
    const player = mergeShell(shell, {
      ...live.player,
      leagueId: meta.leagueId,
      leagueLabel: meta.leagueLabel,
    })
    void refreshPlayerStats(
      playerId,
      teamId,
      meta.leagueId,
      preferredSeasonKey,
      player.teamName,
      meta.leagueLabel,
    )
    return { player, source: { kind: 'apiSeason', apiSeason: live.apiSeason } }
  }

  if (shell) {
    return { player: shell, source: { kind: 'window', seasonKey: preferredSeasonKey } }
  }

  return null
}
