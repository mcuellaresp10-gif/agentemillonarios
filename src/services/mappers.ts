import { TEAM_MILLONARIOS } from '@/config/constants'
import type {
  ApiFixtureRaw,
  ApiResponse,
  ApiTeam,
  Fixture,
  FixtureEvent,
  FixtureLineup,
  PlayerSeasonStats,
  StandingRow,
} from '@/types'

export function mapFixture(raw: ApiFixtureRaw): Fixture {
  const isHome = raw.teams.home.id === TEAM_MILLONARIOS
  const opponent = isHome ? raw.teams.away : raw.teams.home
  const mg = isHome ? raw.goals.home : raw.goals.away
  const og = isHome ? raw.goals.away : raw.goals.home
  let result: Fixture['result']
  if (raw.fixture.status.short === 'FT' && mg != null && og != null) {
    if (mg > og) result = 'W'
    else if (mg < og) result = 'L'
    else result = 'D'
  }
  return {
    id: raw.fixture.id,
    date: raw.fixture.date,
    status: raw.fixture.status.short,
    statusLong: raw.fixture.status.long,
    venue: raw.fixture.venue?.name,
    city: raw.fixture.venue?.city,
    referee: raw.fixture.referee ?? undefined,
    leagueId: raw.league.id,
    leagueName: raw.league.name,
    leagueLogo: raw.league.logo,
    round: raw.league.round,
    home: raw.teams.home,
    away: raw.teams.away,
    goalsHome: raw.goals.home,
    goalsAway: raw.goals.away,
    isMillonariosHome: isHome,
    opponent,
    millonariosGoals: mg,
    opponentGoals: og,
    result,
  }
}

export function mapFixturesResponse(
  data: ApiResponse<ApiFixtureRaw[]>,
): Fixture[] {
  return (data.response ?? []).map(mapFixture)
}

export function mapStandings(
  data: ApiResponse<
    Array<{
      league: { id: number }
      standings: Array<
        Array<{
          rank: number
          team: ApiTeam
          all: {
            played: number
            win: number
            draw: number
            lose: number
            goals: { for: number; against: number }
          }
          goalsDiff: number
          points: number
          form?: string
          group?: string
        }>
      >
    }>
  >,
): StandingRow[] {
  const rows: StandingRow[] = []
  for (const block of data.response ?? []) {
    const standingsGroups =
      block.standings ??
      (block as { league?: { standings?: typeof block.standings } }).league
        ?.standings ??
      []
    for (const group of standingsGroups) {
      for (const row of group) {
        rows.push({
          rank: row.rank,
          team: row.team,
          played: row.all.played,
          win: row.all.win,
          draw: row.all.draw,
          lose: row.all.lose,
          goalsFor: row.all.goals.for,
          goalsAgainst: row.all.goals.against,
          diff: row.goalsDiff,
          points: row.points,
          form: row.form,
          group: row.group,
        })
      }
    }
  }
  return rows
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSinglePlayerStat(item: any, stat: any): PlayerSeasonStats {
  const player = item.player
  const games = stat.games ?? {}
  const goals = stat.goals ?? {}
  const cards = stat.cards ?? {}
  const passes = stat.passes ?? {}
  const shots = stat.shots ?? {}
  const duels = stat.duels ?? {}
  const dribbles = stat.dribbles ?? {}
  const tackles = stat.tackles ?? {}
  const fouls = stat.fouls ?? {}
  const pos = games.position ?? '—'
  const duelsTotal = duels.total ?? null
  const duelsWon = duels.won ?? null

  return {
    playerId: player.id,
    name: player.name,
    photo: player.photo ?? '',
    age: player.age ?? null,
    nationality: player.nationality ?? '',
    position: pos,
    positionsPlayed: [pos],
    number: games.number ?? null,
    appearances: games.appearences ?? games.appearances ?? 0,
    minutes: games.minutes ?? 0,
    goals: goals.total ?? 0,
    assists: goals.assists ?? 0,
    yellow: cards.yellow ?? 0,
    red: cards.red ?? 0,
    rating: games.rating ? parseFloat(String(games.rating)) : null,
    ratingAvg: games.rating ? parseFloat(String(games.rating)) : null,
    xG: goals.expected ?? goals.xg ?? null,
    xG90: null,
    passes: passes.total ?? null,
    passAccuracy: passes.accuracy ? parseFloat(String(passes.accuracy)) : null,
    keyPasses: passes.key ?? null,
    shotsTotal: shots.total ?? null,
    shotsOn: shots.on ?? null,
    duelsTotal,
    duelsWon,
    duelsWonPct:
      duelsTotal && duelsWon
        ? Math.round((duelsWon / duelsTotal) * 1000) / 10
        : null,
    dribblesAttempted: dribbles.attempts ?? null,
    dribblesSuccess: dribbles.success ?? null,
    tackles: tackles.total ?? null,
    interceptions: tackles.interceptions ?? null,
    foulsDrawn: fouls.drawn ?? null,
    foulsCommitted: fouls.committed ?? null,
    saves: goals.saves ?? null,
    conceded: goals.conceded ?? null,
    teamId: stat.team?.id ?? 0,
    teamName: stat.team?.name ?? '',
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface LastTransfer {
  lastTransferFee: string | null
  lastTransferDate: string | null
  clubIn?: string
  clubOut?: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapLastPlayerTransfer(data: ApiResponse<any[]>): LastTransfer | null {
  const block = data.response?.[0]
  const transfers = block?.transfers as
    | Array<{
        date?: string
        type?: string
        teams?: { in?: { name?: string }; out?: { name?: string } }
      }>
    | undefined
  if (!transfers?.length) return null

  const sorted = [...transfers].sort(
    (a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime(),
  )
  const latest = sorted[0]
  return {
    lastTransferFee: latest.type ?? null,
    lastTransferDate: latest.date ?? null,
    clubIn: latest.teams?.in?.name,
    clubOut: latest.teams?.out?.name,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPlayerStatistics(data: ApiResponse<any[]>): PlayerSeasonStats[] {
  const out: PlayerSeasonStats[] = []
  for (const item of data.response ?? []) {
    for (const stat of item.statistics ?? []) {
      out.push(mapSinglePlayerStat(item, stat))
    }
  }
  return out
}

export function mapEvents(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: ApiResponse<any[]>,
): FixtureEvent[] {
  return (data.response ?? []).map((e) => ({
    time: e.time?.elapsed ?? 0,
    teamId: e.team?.id ?? 0,
    player: e.player?.name ?? '—',
    assist: e.assist?.name,
    type: e.type ?? '',
    detail: e.detail ?? '',
  }))
}

export function mapLineups(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: ApiResponse<any[]>,
): FixtureLineup[] {
  return (data.response ?? []).map((l) => ({
    teamId: l.team?.id ?? 0,
    formation: l.formation ?? '—',
    coach: l.coach?.name ?? '—',
    startXI: (l.startXI ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => ({
        name: p.player?.name ?? '—',
        number: p.player?.number ?? 0,
        pos: p.player?.pos ?? '',
      }),
    ),
    substitutes: (l.substitutes ?? []).map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p: any) => ({
        name: p.player?.name ?? '—',
        number: p.player?.number ?? 0,
        pos: p.player?.pos ?? '',
      }),
    ),
  }))
}
