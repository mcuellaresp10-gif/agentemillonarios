import type { Request, Response } from 'express'
import {
  TEAM_MILLONARIOS,
  COLOMBIANOS_EXTERIOR_LEAGUES,
  SCOUT_LEAGUES,
} from '../../src/config/constants.ts'
import { defaultSeasonKey } from '../../src/config/scoutSnapshotSeasons.ts'
import type { SeasonKey } from '../../src/types/scoutSnapshot.ts'
import {
  getPlayerById,
  getPlayerBestAcrossSeasons,
  getPlayersForTeam,
  getPlayersForTeams,
  getTeamsByLeagues,
  getMillonariosExport,
} from '../db/scoutDb.ts'
import { hasMeaningfulStats } from '../../src/utils/playerStatsPick.ts'
import { loadApiKeyFromEnv } from '../services/scoutApiClient.ts'
import {
  createSyncContext,
  syncPlayerToDb,
  syncTeamSeasonToDb,
} from '../services/scoutSyncCore.ts'

function parseSeasonKey(raw: unknown): SeasonKey {
  if (raw === '2024-2025' || raw === '2025-2026') return raw
  return defaultSeasonKey()
}

function parseLeagueIds(raw: unknown): number[] {
  if (typeof raw !== 'string' || !raw.trim()) return []
  return raw.split(',').map(Number).filter((n) => n > 0)
}

function leagueLabelFor(leagueId: number): string {
  const all = [...SCOUT_LEAGUES, ...COLOMBIANOS_EXTERIOR_LEAGUES]
  return all.find((l) => l.id === leagueId)?.label ?? `Liga ${leagueId}`
}

export function isScoutWriteEnabled(): boolean {
  if (process.env.NODE_ENV !== 'production') return true
  return process.env.SCOUT_WRITE_ENABLED === 'true'
}

export function scoutTeamsHandler(req: Request, res: Response): void {
  try {
    const seasonKey = parseSeasonKey(req.query.seasonKey)
    const leagueIds = parseLeagueIds(req.query.leagueIds)
    if (!leagueIds.length) {
      res.status(400).json({ error: 'leagueIds requerido' })
      return
    }
    const teams = getTeamsByLeagues(leagueIds, seasonKey)
    res.json({ teams, seasonKey, source: 'sqlite' })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
}

export function scoutPlayersHandler(req: Request, res: Response): void {
  try {
    const seasonKey = parseSeasonKey(req.query.seasonKey)
    const teamId = Number(req.query.teamId)
    const leagueId = Number(req.query.leagueId)
    const leagueLabel = String(req.query.leagueLabel ?? leagueLabelFor(leagueId))

    if (!teamId || !leagueId) {
      res.status(400).json({ error: 'teamId y leagueId requeridos' })
      return
    }

    const players = getPlayersForTeam(teamId, leagueId, leagueLabel, seasonKey)
    res.json({ players, seasonKey, source: 'sqlite' })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
}

export function scoutPlayerHandler(req: Request, res: Response): void {
  try {
    const playerId = Number(req.params.id)
    const seasonKey = parseSeasonKey(req.query.seasonKey)
    const teamId = Number(req.query.teamId)
    const leagueId = Number(req.query.leagueId)
    const leagueLabel = String(req.query.leagueLabel ?? leagueLabelFor(leagueId))

    if (!playerId || !teamId || !leagueId) {
      res.status(400).json({ error: 'id, teamId y leagueId requeridos' })
      return
    }

    let player = getPlayerById(playerId, teamId, leagueId, leagueLabel, seasonKey)
    let statsDisplay: Record<string, unknown> = { kind: 'window', seasonKey }

    if (player && hasMeaningfulStats(player)) {
      res.json({ player, seasonKey, source: 'sqlite', statsDisplay })
      return
    }

    const best = getPlayerBestAcrossSeasons(
      playerId,
      teamId,
      leagueId,
      leagueLabel,
      seasonKey,
    )

    if (best) {
      player = best.player
      statsDisplay =
        best.row.seasonKey !== seasonKey
          ? { kind: 'priorWindow', seasonKey: best.row.seasonKey }
          : { kind: 'apiSeason', apiSeason: best.row.apiSeason }
      res.json({ player, seasonKey, source: 'sqlite', statsDisplay })
      return
    }

    if (player) {
      res.json({ player, seasonKey, source: 'sqlite', statsDisplay })
      return
    }

    res.status(404).json({ error: 'Jugador no encontrado en BD' })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
}

export async function scoutFetchPlayerHandler(
  req: Request,
  res: Response,
): Promise<void> {
  if (!isScoutWriteEnabled()) {
    res.status(403).json({ error: 'SCOUT_WRITE_ENABLED no activo en producción' })
    return
  }

  try {
    const {
      playerId,
      teamId,
      leagueId,
      teamName,
      leagueLabel,
      seasonKey: rawSeason,
    } = req.body as {
      playerId?: number
      teamId?: number
      leagueId?: number
      teamName?: string
      leagueLabel?: string
      seasonKey?: SeasonKey
    }

    if (!playerId || !teamId || !leagueId) {
      res.status(400).json({ error: 'playerId, teamId, leagueId requeridos' })
      return
    }

    const seasonKey = parseSeasonKey(rawSeason)
    const apiKey = loadApiKeyFromEnv(process.cwd())
    const ctx = createSyncContext(apiKey, 60)
    const player = await syncPlayerToDb(
      ctx,
      playerId,
      teamId,
      teamName ?? `Team ${teamId}`,
      leagueId,
      leagueLabel ?? leagueLabelFor(leagueId),
      seasonKey,
      'manual',
    )

    if (!player) {
      res.status(404).json({ error: 'Sin stats en API-Football' })
      return
    }

    res.json({ player, seasonKey, source: 'sqlite', requestsUsed: ctx.getRequestsUsed() })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
}

export async function scoutFetchTeamHandler(
  req: Request,
  res: Response,
): Promise<void> {
  if (!isScoutWriteEnabled()) {
    res.status(403).json({ error: 'SCOUT_WRITE_ENABLED no activo en producción' })
    return
  }

  try {
    const { teamId, leagueId, teamName, leagueLabel, seasonKey: rawSeason } = req.body as {
      teamId?: number
      leagueId?: number
      teamName?: string
      leagueLabel?: string
      seasonKey?: SeasonKey
    }

    if (!teamId || !leagueId) {
      res.status(400).json({ error: 'teamId y leagueId requeridos' })
      return
    }

    const seasonKey = parseSeasonKey(rawSeason)
    const apiKey = loadApiKeyFromEnv(process.cwd())
    const ctx = createSyncContext(apiKey, 60)
    const players = await syncTeamSeasonToDb(
      ctx,
      teamId,
      teamName ?? `Team ${teamId}`,
      leagueId,
      leagueLabel ?? leagueLabelFor(leagueId),
      seasonKey,
      'manual',
    )

    res.json({
      players,
      seasonKey,
      source: 'sqlite',
      requestsUsed: ctx.getRequestsUsed(),
    })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
}

export function scoutPoolHandler(req: Request, res: Response): void {
  try {
    const seasonKey = parseSeasonKey(req.query.seasonKey)
    const entriesRaw = req.query.entries
    if (typeof entriesRaw !== 'string') {
      res.status(400).json({ error: 'entries JSON requerido' })
      return
    }
    const entries = JSON.parse(entriesRaw) as Array<{
      teamId: number
      leagueId: number
      leagueLabel: string
    }>
    const players = getPlayersForTeams(entries, seasonKey)
    res.json({ players, seasonKey, source: 'sqlite' })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
}

export function scoutMillonariosHandler(req: Request, res: Response): void {
  try {
    const seasonKey = parseSeasonKey(req.query.seasonKey)
    const players = getMillonariosExport(seasonKey)
    res.json({ players, seasonKey, teamId: TEAM_MILLONARIOS, source: 'sqlite' })
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'Error' })
  }
}
