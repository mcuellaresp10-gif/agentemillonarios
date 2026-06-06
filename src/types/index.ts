export interface ApiTeam {
  id: number
  name: string
  logo: string
}

export interface ApiLeague {
  id: number
  name: string
  logo: string
  season: number
  round?: string
}

export interface ApiFixtureRaw {
  fixture: {
    id: number
    date: string
    status: { short: string; long: string }
    venue?: { name?: string; city?: string }
    referee?: string | null
  }
  league: ApiLeague
  teams: { home: ApiTeam; away: ApiTeam }
  goals: { home: number | null; away: number | null }
  score: {
    fulltime: { home: number | null; away: number | null }
  }
}

export interface Fixture {
  id: number
  date: string
  status: string
  statusLong: string
  venue?: string
  city?: string
  referee?: string
  leagueId: number
  leagueName: string
  leagueLogo: string
  round?: string
  home: ApiTeam
  away: ApiTeam
  goalsHome: number | null
  goalsAway: number | null
  isMillonariosHome: boolean
  opponent: ApiTeam
  millonariosGoals: number | null
  opponentGoals: number | null
  result?: 'W' | 'D' | 'L'
}

export interface FixtureEvent {
  time: number
  teamId: number
  player: string
  assist?: string
  type: string
  detail: string
}

export interface LineupPlayer {
  name: string
  number: number
  pos: string
}

export interface FixtureLineup {
  teamId: number
  formation: string
  coach: string
  startXI: LineupPlayer[]
  substitutes: LineupPlayer[]
}

export interface H2HPlayerAggregate {
  name: string
  goals: number
  assists: number
  appearances: number
}

export interface H2HFixturePlayerMeta {
  fixtureId: number
  scorers: string[]
  formation?: string
  coach?: string
}

export interface H2HPlayerStatsBundle {
  players: H2HPlayerAggregate[]
  topScorer: H2HPlayerAggregate | null
  mostAppearances: H2HPlayerAggregate | null
  byFixture: H2HFixturePlayerMeta[]
  fixturesAnalyzed: number
}

export interface StandingRow {
  rank: number
  team: ApiTeam
  played: number
  win: number
  draw: number
  lose: number
  goalsFor: number
  goalsAgainst: number
  diff: number
  points: number
  form?: string
  group?: string
}

export interface PlayerSeasonStats {
  playerId: number
  name: string
  photo: string
  age: number | null
  nationality: string
  position: string
  positionsPlayed: string[]
  number: number | null
  appearances: number
  minutes: number
  goals: number
  assists: number
  yellow: number
  red: number
  rating: number | null
  ratingAvg: number | null
  xG: number | null
  xG90: number | null
  passes: number | null
  passAccuracy: number | null
  keyPasses: number | null
  shotsTotal: number | null
  shotsOn: number | null
  duelsTotal: number | null
  duelsWon: number | null
  duelsWonPct: number | null
  dribblesAttempted: number | null
  dribblesSuccess: number | null
  tackles: number | null
  interceptions: number | null
  foulsDrawn: number | null
  foulsCommitted: number | null
  saves: number | null
  conceded: number | null
  teamId: number
  teamName: string
  leagueId?: number
  leagueLabel?: string
  lastTransferFee?: string | null
  lastTransferDate?: string | null
  marketValueEur?: number | null
  marketValueLabel?: string | null
  transfermarktUrl?: string
  marketMatchConfidence?: 'alta' | 'media' | 'baja'
}

export interface PlayerTransferSummary {
  lastTransferFee: string | null
  lastTransferDate: string | null
  clubIn?: string | null
  clubOut?: string | null
}

export interface PlayerMarketValue {
  marketValueEur: number | null
  marketValueLabel: string | null
  transfermarktUrl?: string
  matchConfidence: 'alta' | 'media' | 'baja' | null
  configured: boolean
  error?: string
}

export interface ScoutTeam {
  id: number
  name: string
  logo: string
  leagueId: number
  leagueLabel: string
}

export interface PlayerMatchRating {
  fixtureId: number
  date: string
  opponent: string
  rating: number | null
  minutes: number
  position: string
  result?: 'W' | 'D' | 'L'
}

export type ScoutCandidate = PlayerSeasonStats

export interface AnalisisGuardado {
  partido_id: number | string
  tipo: 'previa' | 'post' | 'scout'
  contenido: string
  modelo_usado: string
  fecha_generacion: string
  fuentes: string[]
}

export interface H2HAggregate {
  wins: number
  draws: number
  losses: number
  goalsMillonarios: number
  goalsOpponent: number
  avgGoalsMillonarios: number
  avgGoalsOpponent: number
}

export interface ApiPaging {
  current: number
  total: number
}

export interface ApiResponse<T> {
  response: T
  paging?: ApiPaging
  errors?: Record<string, string>
}
