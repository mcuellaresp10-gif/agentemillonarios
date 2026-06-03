import axios, { type AxiosError } from 'axios'
import { TEAM_MILLONARIOS, SEASON, H2H_FIXTURES_LAST } from '@/config/constants'
import {
  cacheKey,
  getCached,
  getStaleCached,
  setCached,
  logApiRequest,
} from './cache'
import {
  mapFixturesResponse,
  mapStandings,
  mapPlayerStatistics,
  mapLastPlayerTransfer,
  mapEvents,
  mapLineups,
} from './mappers'
import type { LastTransfer } from './mappers'
import { mergePlayerStatistics } from './playerMerge'
import type { ApiFixtureRaw, ApiResponse, ApiTeam, Fixture, PlayerSeasonStats } from '@/types'

const client = axios.create({
  baseURL: '/api/football',
  timeout: 30000,
})

let useStaleOnError = false

export function setUseStaleFallback(v: boolean) {
  useStaleOnError = v
}

async function fetchApi<T>(
  endpoint: string,
  params: Record<string, string | number | undefined>,
): Promise<T> {
  const cleanParams: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) cleanParams[k] = v
  }
  const key = cacheKey(endpoint, cleanParams)
  const cached = getCached<T>(key)
  if (cached) return cached

  logApiRequest(endpoint)
  try {
    const { data } = await client.get<T>(endpoint, { params: cleanParams })
    setCached(key, data)
    return data
  } catch (err) {
    const axiosErr = err as AxiosError
    const stale = getStaleCached<T>(key)
    if (stale && (useStaleOnError || axiosErr.response?.status === 429)) {
      return stale
    }
    if (stale) return stale
    throw err
  }
}

export async function getFixtures(opts: {
  team?: number
  league?: number
  season?: number
  status?: string
  last?: number
  next?: number
}): Promise<Fixture[]> {
  const data = await fetchApi<ApiResponse<ApiFixtureRaw[]>>('/fixtures', {
    team: opts.team ?? TEAM_MILLONARIOS,
    league: opts.league,
    season: opts.season ?? SEASON,
    status: opts.status,
    last: opts.last,
    next: opts.next,
  })
  return mapFixturesResponse(data)
}

export async function getNextFixture(): Promise<Fixture | null> {
  const all = await getFixtures({ status: 'NS', next: 5 })
  const upcoming = all
    .filter((f) => new Date(f.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return upcoming[0] ?? all[0] ?? null
}

export async function getFixtureById(id: number): Promise<Fixture | null> {
  const data = await fetchApi<ApiResponse<ApiFixtureRaw[]>>('/fixtures', { id })
  const mapped = mapFixturesResponse(data)
  return mapped[0] ?? null
}

export async function getFixtureEvents(fixtureId: number) {
  const data = await fetchApi<ApiResponse<unknown[]>>('/fixtures/events', {
    fixture: fixtureId,
  })
  return mapEvents(data)
}

export async function getFixtureLineups(fixtureId: number) {
  const data = await fetchApi<ApiResponse<unknown[]>>('/fixtures/lineups', {
    fixture: fixtureId,
  })
  return mapLineups(data)
}

export async function getFixtureStatistics(fixtureId: number) {
  return fetchApi<ApiResponse<unknown[]>>('/fixtures/statistics', {
    fixture: fixtureId,
  })
}

export async function getPlayerTransfers(playerId: number): Promise<LastTransfer | null> {
  const data = await fetchApi<ApiResponse<unknown[]>>('/transfers', {
    player: playerId,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return mapLastPlayerTransfer(data as any)
}

export async function getPlayersStatistics(team = TEAM_MILLONARIOS, season = SEASON) {
  const data = await fetchApi<ApiResponse<unknown[]>>('/players', {
    team,
    season,
  })
  return mergePlayerStatistics(mapPlayerStatistics(data))
}

export async function getPlayerStatisticsById(
  playerId: number,
  apiSeason: number,
  teamId?: number,
): Promise<PlayerSeasonStats[]> {
  const data = await fetchApi<ApiResponse<unknown[]>>('/players', {
    id: playerId,
    season: apiSeason,
  })
  const rows = mapPlayerStatistics(data)
  if (teamId == null) return rows
  return rows.filter((r) => r.teamId === teamId || r.teamId === 0)
}

export async function getFixturePlayers(fixtureId: number, teamId: number) {
  return fetchApi<ApiResponse<unknown[]>>('/fixtures/players', {
    fixture: fixtureId,
    team: teamId,
  })
}

export async function getHeadToHead(opponentId: number, last = H2H_FIXTURES_LAST) {
  const h2h = `${TEAM_MILLONARIOS}-${opponentId}`
  const data = await fetchApi<ApiResponse<ApiFixtureRaw[]>>('/fixtures/headtohead', {
    h2h,
    last,
  })
  return mapFixturesResponse(data)
}

export async function getStandings(league: number, season = SEASON) {
  const data = await fetchApi<ApiResponse<unknown[]>>('/standings', {
    league,
    season,
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return mapStandings(data as any)
}

export async function getTeamsByLeague(league: number, season = SEASON) {
  const data = await fetchApi<ApiResponse<{ team: ApiTeam }[]>>('/teams', {
    league,
    season,
  })
  return (data.response ?? []).map((t) => t.team)
}

export async function getTeamStatistics(team = TEAM_MILLONARIOS, league = 239, season = SEASON) {
  return fetchApi<ApiResponse<unknown[]>>('/teams/statistics', {
    team,
    league,
    season,
  })
}

export async function searchPlayersByName(name: string, league = 239, season = SEASON) {
  const data = await fetchApi<ApiResponse<unknown[]>>('/players', {
    league,
    season,
    search: name,
  })
  return mapPlayerStatistics(data)
}

export async function getTeamInfo(teamId: number) {
  const data = await fetchApi<ApiResponse<{ team: ApiTeam }[]>>('/teams', {
    id: teamId,
  })
  return data.response?.[0]?.team ?? null
}
