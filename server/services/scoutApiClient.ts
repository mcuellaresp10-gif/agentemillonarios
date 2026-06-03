/**
 * Cliente directo API-Football para sync (servidor y scripts).
 */
import fs from 'node:fs'
import path from 'node:path'
import { mapPlayerStatistics } from '../../src/services/mappers.ts'
import { mergePlayerStatistics } from '../../src/services/playerMerge.ts'
import type { ApiResponse, ApiTeam, PlayerSeasonStats } from '../../src/types/index.ts'

export interface SquadPlayer {
  id: number
  name: string
  age: number | null
  number: number | null
  photo: string
}

export interface ApiClientOptions {
  apiKey: string
  baseUrl?: string
  delayMs?: number
  onRequest?: () => void
}

export function createScoutApiClient(opts: ApiClientOptions) {
  const baseUrl = (opts.baseUrl ?? 'https://v3.football.api-sports.io').replace(/\/$/, '')
  const delayMs = opts.delayMs ?? 80

  async function sleep() {
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs))
  }

  async function apiGet<T>(
    path: string,
    params: Record<string, string | number> = {},
  ): Promise<T> {
    opts.onRequest?.()
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)]),
    ).toString()
    const url = `${baseUrl}/${path}${qs ? `?${qs}` : ''}`
    const res = await fetch(url, { headers: { 'x-apisports-key': opts.apiKey } })
    if (!res.ok) throw new Error(`API ${path} → ${res.status}`)
    const json = (await res.json()) as { response: T; errors?: unknown }
    if (json.errors && Object.keys(json.errors as object).length > 0) {
      console.warn(`  ⚠ ${path}`, json.errors)
    }
    await sleep()
    return json.response
  }

  async function fetchTeams(leagueId: number, apiSeason: number): Promise<ApiTeam[]> {
    const raw = await apiGet<{ team: ApiTeam }[]>('teams', {
      league: leagueId,
      season: apiSeason,
    })
    return raw.map((t) => t.team)
  }

  async function fetchSquad(teamId: number): Promise<SquadPlayer[]> {
    try {
      const squads = await apiGet<
        Array<{ team: { id: number }; players: SquadPlayer[] }>
      >('players/squads', { team: teamId })
      return squads[0]?.players ?? []
    } catch {
      return []
    }
  }

  async function fetchPlayerStatsById(
    playerId: number,
    apiSeason: number,
  ): Promise<PlayerSeasonStats[]> {
    const data = await apiGet<unknown[]>('players', { id: playerId, season: apiSeason })
    return mapPlayerStatistics({ response: data } as ApiResponse<unknown[]>)
  }

  async function fetchTeamPlayersPaginated(
    teamId: number,
    apiSeason: number,
  ): Promise<PlayerSeasonStats[]> {
    const all: PlayerSeasonStats[] = []
    let page = 1
    let totalPages = 1
    while (page <= totalPages) {
      opts.onRequest?.()
      const qs = new URLSearchParams({
        team: String(teamId),
        season: String(apiSeason),
        page: String(page),
      }).toString()
      const url = `${baseUrl}/players?${qs}`
      const res = await fetch(url, { headers: { 'x-apisports-key': opts.apiKey } })
      if (!res.ok) break
      const json = (await res.json()) as ApiResponse<unknown[]> & {
        paging?: { current: number; total: number }
      }
      const mapped = mapPlayerStatistics(json)
      all.push(...mapped)
      totalPages = json.paging?.total ?? 1
      page++
      await sleep()
    }
    return mergePlayerStatistics(all)
  }

  async function searchPlayers(
    name: string,
    leagueId: number,
    apiSeason: number,
  ): Promise<PlayerSeasonStats[]> {
    const data = await apiGet<unknown[]>('players', {
      league: leagueId,
      season: apiSeason,
      search: name,
    })
    return mapPlayerStatistics({ response: data } as ApiResponse<unknown[]>)
  }

  async function fetchTeamPlayersMerged(
    teamId: number,
    teamName: string,
    leagueId: number,
    leagueLabel: string,
    apiSeasons: number[],
  ): Promise<PlayerSeasonStats[]> {
    const squad = await fetchSquad(teamId)
    const playerIds = new Set<number>()

    if (squad.length) {
      for (const sp of squad) playerIds.add(sp.id)
    } else {
      for (const apiSeason of apiSeasons) {
        const paginated = await fetchTeamPlayersPaginated(teamId, apiSeason)
        for (const p of paginated) playerIds.add(p.playerId)
      }
    }

    const rawByPlayer: PlayerSeasonStats[] = []
    for (const playerId of playerIds) {
      for (const apiSeason of apiSeasons) {
        try {
          const rows = await fetchPlayerStatsById(playerId, apiSeason)
          for (const r of rows) {
            if (r.teamId === teamId || r.teamId === 0) {
              rawByPlayer.push({
                ...r,
                teamId,
                teamName,
                leagueId,
                leagueLabel,
              })
            }
          }
        } catch {
          /* jugador sin stats en esta temporada */
        }
      }
    }

    if (!rawByPlayer.length && squad.length) {
      for (const sp of squad) {
        rawByPlayer.push({
          playerId: sp.id,
          name: sp.name,
          photo: sp.photo ?? '',
          age: sp.age,
          nationality: '',
          position: '—',
          positionsPlayed: ['—'],
          number: sp.number,
          appearances: 0,
          minutes: 0,
          goals: 0,
          assists: 0,
          yellow: 0,
          red: 0,
          rating: null,
          ratingAvg: null,
          xG: null,
          xG90: null,
          passes: null,
          passAccuracy: null,
          keyPasses: null,
          shotsTotal: null,
          shotsOn: null,
          duelsTotal: null,
          duelsWon: null,
          duelsWonPct: null,
          dribblesAttempted: null,
          dribblesSuccess: null,
          tackles: null,
          interceptions: null,
          foulsDrawn: null,
          foulsCommitted: null,
          saves: null,
          conceded: null,
          teamId,
          teamName,
          leagueId,
          leagueLabel,
        })
      }
    }

    const byPlayerId = new Map<number, PlayerSeasonStats[]>()
    for (const r of rawByPlayer) {
      if (!byPlayerId.has(r.playerId)) byPlayerId.set(r.playerId, [])
      byPlayerId.get(r.playerId)!.push(r)
    }

    const merged: PlayerSeasonStats[] = []
    for (const group of byPlayerId.values()) {
      const m = mergePlayerStatistics(group)
      if (m[0]) merged.push(m[0])
    }
    return merged
  }

  return {
    apiGet,
    fetchTeams,
    fetchSquad,
    fetchPlayerStatsById,
    fetchTeamPlayersPaginated,
    searchPlayers,
    fetchTeamPlayersMerged,
  }
}

export type ScoutApiClient = ReturnType<typeof createScoutApiClient>

export function loadApiKeyFromEnv(root: string): string {
  const env: Record<string, string> = { ...process.env } as Record<string, string>
  for (const file of ['.env.local', '.env']) {
    try {
      const raw = fs.readFileSync(path.join(root, file), 'utf8')
      for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^([^#=]+)=(.*)$/)
        if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
      }
    } catch {
      /* missing */
    }
  }
  const key = env.API_FOOTBALL_KEY
  if (!key || key === 'your_api_football_key_here') {
    throw new Error('Falta API_FOOTBALL_KEY en .env o .env.local')
  }
  return key
}
