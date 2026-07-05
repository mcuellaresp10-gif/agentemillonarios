import type { Fixture, PlayerSeasonStats, StandingRow } from '@/types'
import { getStrengthGap, getTeamPriorStrength } from '@/data/leagueStrengthPriors'
import {
  calibrateLambdasTo1X2,
  expectedGoalsFromStrength,
  outcomeProbsFromStrength,
  poissonOutcomeProbs,
  type MatchOutcomeProbs,
} from '@/utils/matchStrengthModel'

export type { MatchOutcomeProbs }

export interface TeamGroupState {
  teamId: number
  teamName: string
  points: number
  goalsFor: number
  goalsAgainst: number
  priorStrength: number
}

export interface MatchLambdas {
  home: number
  away: number
  target1X2: MatchOutcomeProbs
}

export interface MatchLambdaEstimateInput {
  homeState: TeamGroupState
  awayState: TeamGroupState
  h2h?: Fixture[]
  isPreSeason: boolean
  baseTotalGoals?: number
  playersHome?: PlayerSeasonStats[]
  playersAway?: PlayerSeasonStats[]
  standingHome?: StandingRow
  standingAway?: StandingRow
}

export const DEFAULT_TOTAL_GOALS = 2.35
export const MIN_TOTAL_GOALS = 2.1
export const H2H_WEIGHT = 0.45
export const BASE_DRAW = 0.12
export const MAX_SIM_GOALS = 8

export function standingToTeamGroupState(
  s: StandingRow,
  isPreSeason: boolean,
): TeamGroupState {
  return {
    teamId: s.team.id,
    teamName: s.team.name,
    points: s.points,
    goalsFor: s.goalsFor,
    goalsAgainst: s.goalsAgainst,
    priorStrength: getTeamPriorStrength(
      s.team.name,
      s.points,
      s.played,
      s.goalsFor,
      s.goalsAgainst,
      isPreSeason,
    ),
  }
}

export function teamStrengthFromState(state: TeamGroupState): number {
  return state.priorStrength
}

function computeSquadAttackMod(players: PlayerSeasonStats[]): number {
  if (players.length === 0) return 1
  const scores = [...players]
    .map((p) => {
      const rating = p.ratingAvg ?? p.rating ?? 6.5
      const minutes = Math.max(p.minutes, 90)
      const goalsPer90 = (p.goals / minutes) * 90
      return rating * 0.65 + goalsPer90 * 4
    })
    .sort((a, b) => b - a)
    .slice(0, 11)
  const avg = scores.reduce((sum, v) => sum + v, 0) / scores.length
  return Math.max(0.75, Math.min(1.35, avg / 7))
}

function computeSquadDefenseMod(
  players: PlayerSeasonStats[],
  standing: StandingRow | undefined,
): number {
  let mod = 1
  if (standing && standing.played > 0) {
    const gaPerGame = standing.goalsAgainst / standing.played
    mod *= Math.max(0.82, Math.min(1.18, gaPerGame / 1.05))
  }
  const defensive = players.filter((p) => {
    const pos = (p.position || '').toLowerCase()
    return pos.includes('def') || pos.includes('goal') || pos === 'g' || pos.includes('porter')
  })
  if (defensive.length > 0) {
    const avgRating =
      defensive.reduce((sum, p) => sum + (p.ratingAvg ?? p.rating ?? 6.5), 0) / defensive.length
    mod *= Math.max(0.85, Math.min(1.15, 7 / avgRating))
  }
  return mod
}

function computeH2HGoalRates(
  h2h: Fixture[],
  teamAId: number,
  teamBId: number,
): { rateA: number; rateB: number } | null {
  const finished = h2h.filter((f) => f.status === 'FT' || f.result != null)
  if (finished.length === 0) return null

  let goalsA = 0
  let goalsB = 0
  let count = 0

  for (const f of finished) {
    const hg = f.goalsHome ?? 0
    const ag = f.goalsAway ?? 0
    const homeId = f.home.id
    const awayId = f.away.id

    if (![homeId, awayId].includes(teamAId) || ![homeId, awayId].includes(teamBId)) continue

    if (homeId === teamAId) {
      goalsA += hg
      goalsB += ag
    } else {
      goalsA += ag
      goalsB += hg
    }
    count++
  }

  if (count === 0) return null
  return { rateA: goalsA / count, rateB: goalsB / count }
}

function buildOutcomeProbsFromStrength(
  homeId: number,
  awayId: number,
  states: TeamGroupState[],
): MatchOutcomeProbs {
  const home = states.find((s) => s.teamId === homeId)
  const away = states.find((s) => s.teamId === awayId)
  if (!home || !away) {
    const half = (1 - BASE_DRAW) / 2
    return { homeWin: half, draw: BASE_DRAW, awayWin: half }
  }
  return outcomeProbsFromStrength(
    teamStrengthFromState(home),
    teamStrengthFromState(away),
  )
}

function blendProbs(
  a: MatchOutcomeProbs,
  b: MatchOutcomeProbs,
  weightA: number,
): MatchOutcomeProbs {
  const wB = 1 - weightA
  let hw = a.homeWin * weightA + b.homeWin * wB
  let d = a.draw * weightA + b.draw * wB
  let aw = a.awayWin * weightA + b.awayWin * wB
  const sum = hw + d + aw || 1
  return { homeWin: hw / sum, draw: d / sum, awayWin: aw / sum }
}

export function buildOutcomeProbsFromH2H(
  h2h: Fixture[],
  homeId: number,
  awayId: number,
  states: TeamGroupState[],
): MatchOutcomeProbs {
  const fromStrength = buildOutcomeProbsFromStrength(homeId, awayId, states)
  const finished = h2h.filter((f) => f.status === 'FT' || f.result != null)
  if (finished.length === 0) return fromStrength

  let homeWins = 0
  let draws = 0
  let awayWins = 0

  for (const f of finished) {
    const hg = f.goalsHome ?? 0
    const ag = f.goalsAway ?? 0
    const matchHomeId = f.home.id
    const matchAwayId = f.away.id

    if (![matchHomeId, matchAwayId].includes(homeId) || ![matchHomeId, matchAwayId].includes(awayId))
      continue

    if (hg === ag) {
      draws++
      continue
    }
    const homeIdWon =
      (matchHomeId === homeId && hg > ag) || (matchAwayId === homeId && ag > hg)
    if (homeIdWon) homeWins++
    else awayWins++
  }

  const total = homeWins + draws + awayWins
  if (total === 0) return fromStrength

  const fromH2H = {
    homeWin: homeWins / total,
    draw: Math.max(draws / total, BASE_DRAW),
    awayWin: awayWins / total,
  }
  const sum = fromH2H.homeWin + fromH2H.draw + fromH2H.awayWin
  return blendProbs(
    { homeWin: fromH2H.homeWin / sum, draw: fromH2H.draw / sum, awayWin: fromH2H.awayWin / sum },
    fromStrength,
    H2H_WEIGHT,
  )
}

export function avgGoalsFromFixtures(fixtures: Fixture[]): number {
  const finished = fixtures.filter((f) => f.status === 'FT' || f.result != null)
  if (finished.length === 0) return DEFAULT_TOTAL_GOALS
  let totalGoals = 0
  for (const f of finished) {
    totalGoals += (f.goalsHome ?? 0) + (f.goalsAway ?? 0)
  }
  return totalGoals / finished.length
}

export function estimateMatchLambdas(input: MatchLambdaEstimateInput): MatchLambdas {
  const {
    homeState,
    awayState,
    h2h = [],
    isPreSeason: _isPreSeason,
    baseTotalGoals,
    playersHome = [],
    playersAway = [],
    standingHome,
    standingAway,
  } = input

  const baseTotal = Math.max(
    baseTotalGoals && baseTotalGoals > 0 ? baseTotalGoals : DEFAULT_TOTAL_GOALS,
    MIN_TOTAL_GOALS,
  )

  const strengthA = Math.max(0.1, teamStrengthFromState(homeState))
  const strengthB = Math.max(0.1, teamStrengthFromState(awayState))
  const gap = getStrengthGap(homeState.teamName, awayState.teamName, strengthA, strengthB)

  let { home: lambdaA, away: lambdaB } = expectedGoalsFromStrength({
    strengthA,
    strengthB,
    baseTotal,
    attackModA: computeSquadAttackMod(playersHome),
    attackModB: computeSquadAttackMod(playersAway),
    defenseModA: computeSquadDefenseMod(playersHome, standingHome),
    defenseModB: computeSquadDefenseMod(playersAway, standingAway),
    strengthGap: gap,
  })

  const h2hRates = computeH2HGoalRates(h2h, homeState.teamId, awayState.teamId)
  if (h2hRates) {
    lambdaA = lambdaA * (1 - H2H_WEIGHT) + h2hRates.rateA * H2H_WEIGHT
    lambdaB = lambdaB * (1 - H2H_WEIGHT) + h2hRates.rateB * H2H_WEIGHT
  }

  const target1X2 = buildOutcomeProbsFromH2H(
    h2h,
    homeState.teamId,
    awayState.teamId,
    [homeState, awayState],
  )

  const calibrated = calibrateLambdasTo1X2(lambdaA, lambdaB, target1X2)
  return { ...calibrated, target1X2 }
}

export function resolveOutcomeProbsFromLambdas(
  home: number,
  away: number,
  target1X2: MatchOutcomeProbs,
): MatchOutcomeProbs {
  const poissonOutcomes = poissonOutcomeProbs(home, away)
  const winDrift =
    Math.abs(poissonOutcomes.homeWin - target1X2.homeWin) > 0.05 ||
    Math.abs(poissonOutcomes.awayWin - target1X2.awayWin) > 0.05
  if (winDrift) return { ...target1X2 }
  return poissonOutcomes
}

export function poissonSample(lambda: number, rng: () => number = Math.random): number {
  if (lambda <= 0) return 0
  const limit = Math.exp(-lambda)
  let k = 0
  let p = 1
  do {
    k++
    p *= rng()
  } while (p > limit)
  return k - 1
}
