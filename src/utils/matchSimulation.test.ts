import { describe, expect, it } from 'vitest'
import { runScoreSimulation } from '@/utils/matchSimulation'
import type { StandingRow } from '@/types'

function standing(id: number, name: string, pts: number, played: number): StandingRow {
  return {
    rank: 1,
    team: { id, name, logo: '' },
    played,
    win: Math.floor(pts / 3),
    draw: pts % 3,
    lose: played - Math.floor(pts / 3) - (pts % 3),
    goalsFor: played * 1.2,
    goalsAgainst: played * 0.9,
    diff: 3,
    points: pts,
    form: 'WWDLL',
  }
}

describe('matchSimulation', () => {
  it('genera probabilidades 1X2 válidas', () => {
    const result = runScoreSimulation({
      teamAId: 1125,
      teamBId: 999,
      teamAName: 'Millonarios',
      teamBName: 'Rival',
      standingA: standing(1125, 'Millonarios', 30, 15),
      standingB: standing(999, 'Rival', 22, 15),
      h2h: [],
      playersA: [],
      playersB: [],
      avgGoalsPerMatch: 2.3,
      isPreSeason: false,
      simulations: 500,
    })
    const sum =
      result.outcomeProbs.winA + result.outcomeProbs.draw + result.outcomeProbs.winB
    expect(sum).toBeCloseTo(1, 1)
    expect(result.topScores.length).toBeGreaterThan(0)
    expect(result.expectedGoals.home).toBeGreaterThan(0)
  })
})
