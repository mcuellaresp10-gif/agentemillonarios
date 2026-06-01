import type { Fixture, StandingRow } from '@/types'

export function avgRating(ratings: number[]): number | null {
  const valid = ratings.filter((r) => r > 0 && !Number.isNaN(r))
  if (!valid.length) return null
  const sum = valid.reduce((a, b) => a + b, 0)
  return Math.round((sum / valid.length) * 10) / 10
}

export function xgPer90(xg: number, minutes: number): number | null {
  if (!minutes) return null
  return Math.round(((xg / minutes) * 90) * 100) / 100
}

export function ppda(
  passesAllowed: number,
  defensiveActions: number,
): number | null {
  if (!defensiveActions) return null
  return Math.round((passesAllowed / defensiveActions) * 10) / 10
}

export function shotEffectiveness(goals: number, shotsOn: number): number | null {
  if (!shotsOn) return null
  return Math.round((goals / shotsOn) * 1000) / 10
}

export function formStreak(results: Array<'W' | 'D' | 'L'>): string {
  return results.join('-')
}

export function difficultyRating(
  opponent: StandingRow | undefined,
  totalTeams: number,
): number {
  if (!opponent) return 5
  const rank = opponent.rank
  const normalized = 1 - (rank - 1) / Math.max(totalTeams - 1, 1)
  return Math.round((5 + normalized * 5) * 10) / 10
}

export function ratingColor(rating: number | null): string {
  if (rating == null) return 'text-slate-400'
  if (rating >= 8) return 'text-emerald-600'
  if (rating >= 6) return 'text-amber-500'
  return 'text-red-500'
}

export function resultColor(result?: 'W' | 'D' | 'L'): string {
  if (result === 'W') return 'text-emerald-600'
  if (result === 'L') return 'text-red-500'
  if (result === 'D') return 'text-amber-500'
  return 'text-slate-600'
}

export function computeH2HAggregate(fixtures: Fixture[]) {
  let wins = 0
  let draws = 0
  let losses = 0
  let goalsM = 0
  let goalsO = 0
  for (const f of fixtures) {
    if (f.millonariosGoals == null || f.opponentGoals == null) continue
    goalsM += f.millonariosGoals
    goalsO += f.opponentGoals
    if (f.result === 'W') wins++
    else if (f.result === 'D') draws++
    else if (f.result === 'L') losses++
  }
  const n = fixtures.length || 1
  return {
    wins,
    draws,
    losses,
    goalsMillonarios: goalsM,
    goalsOpponent: goalsO,
    avgGoalsMillonarios: Math.round((goalsM / n) * 10) / 10,
    avgGoalsOpponent: Math.round((goalsO / n) * 10) / 10,
  }
}

export function lastWinlessStreak(fixtures: Fixture[]): number {
  let count = 0
  for (const f of fixtures) {
    if (f.result === 'W') break
    count++
  }
  return count
}
