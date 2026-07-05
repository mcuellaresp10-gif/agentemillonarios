import { describe, expect, it } from 'vitest'
import { replacementFitScore } from '@/utils/scoutReplacement'
import type { PlayerSeasonStats } from '@/types'

function player(partial: Partial<PlayerSeasonStats>): PlayerSeasonStats {
  return {
    playerId: 1,
    name: 'A',
    photo: '',
    age: 26,
    nationality: 'COL',
    position: 'Midfielder',
    positionsPlayed: ['Midfielder'],
    number: 8,
    appearances: 15,
    minutes: 1200,
    goals: 2,
    assists: 3,
    yellow: 0,
    red: 0,
    rating: 7,
    ratingAvg: 7,
    xG: null,
    xG90: 0.15,
    passes: 500,
    passAccuracy: 82,
    keyPasses: 25,
    shotsTotal: 10,
    shotsOn: 4,
    duelsTotal: 100,
    duelsWon: 55,
    duelsWonPct: 55,
    dribblesAttempted: 20,
    dribblesSuccess: 12,
    tackles: 30,
    interceptions: 15,
    foulsDrawn: 5,
    foulsCommitted: 8,
    saves: null,
    conceded: null,
    teamId: 1,
    teamName: 'Millonarios',
    ...partial,
  }
}

describe('scoutReplacement', () => {
  it('score alto para candidato similar', () => {
    const target = player({ playerId: 10 })
    const candidate = player({ playerId: 20, teamId: 2, teamName: 'Rival', ratingAvg: 7.2 })
    const score = replacementFitScore(candidate, target)
    expect(score).toBeGreaterThan(50)
  })

  it('score bajo para posición distinta', () => {
    const target = player({ playerId: 10, position: 'Goalkeeper' })
    const candidate = player({
      playerId: 20,
      position: 'Striker',
      positionsPlayed: ['Striker'],
      teamId: 2,
    })
    const score = replacementFitScore(candidate, target)
    expect(score).toBeLessThan(85)
  })
})
