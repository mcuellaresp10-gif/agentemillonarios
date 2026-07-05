export interface MillonariosAgentContext {
  standings?: Array<{
    rank: number
    team: string
    points: number
    played: number
    form?: string
  }>
  nextFixture?: {
    date: string
    opponent: string
    venue?: string
    isHome: boolean
  }
  millPosition?: {
    rank: number
    points: number
    form?: string
    goalsFor?: number
    goalsAgainst?: number
  }
  squadSummary?: Array<{
    name: string
    position: string
    rating?: number | null
    goals: number
    assists: number
    minutes?: number
    nationality?: string
  }>
  recentResults?: Array<{
    date: string
    opponent: string
    score: string
    result: string
    isHome: boolean
  }>
  alerts?: Array<{ tipo: string; texto: string; detalle?: string }>
  topScoutCandidates?: Array<{
    name: string
    team: string
    position: string
    rating?: number | null
    league?: string
  }>
  simulation?: {
    top8Probability?: number
    expectedPoints?: number
  }
  matchSimulation?: {
    winPct: number
    drawPct: number
    lossPct: number
    expectedGoals: string
  }
  notes?: string
}
