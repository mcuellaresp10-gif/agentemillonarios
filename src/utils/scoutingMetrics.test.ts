import { describe, expect, it } from 'vitest'
import type { PlayerSeasonStats } from '@/types'
import {
  POSITION_METRIC_PROFILES,
  scoutingPositionOptions,
} from '@/config/positionMetricProfiles'
import {
  getMetricViewsForPosition,
  resolveScatterConfig,
} from '@/config/scoutingMetricViews'
import {
  SCOUTING_MIN_MINUTES,
  buildScoutingProfiles,
  extractPer90FromPlayer,
  playerHasScoutingEligibleMinutes,
} from '@/utils/scoutingMetrics'

function mockPlayer(overrides: Partial<PlayerSeasonStats> = {}): PlayerSeasonStats {
  return {
    playerId: 1,
    name: 'Test Player',
    photo: '',
    age: 25,
    nationality: 'COL',
    position: 'Midfielder',
    positionsPlayed: ['Midfielder'],
    number: 10,
    appearances: 10,
    minutes: 900,
    goals: 3,
    assists: 2,
    yellow: 1,
    red: 0,
    rating: 7.2,
    ratingAvg: 7.2,
    xG: 2.5,
    xG90: 0.25,
    passes: 400,
    passAccuracy: 85,
    keyPasses: 20,
    shotsTotal: 15,
    shotsOn: 8,
    duelsTotal: 80,
    duelsWon: 45,
    duelsWonPct: 56,
    dribblesAttempted: 30,
    dribblesSuccess: 18,
    tackles: 25,
    interceptions: 12,
    foulsDrawn: 8,
    foulsCommitted: 10,
    saves: null,
    conceded: null,
    teamId: 100,
    teamName: 'Test FC',
    ...overrides,
  }
}

describe('scoutingMetrics', () => {
  it('requiere mínimo 90 minutos', () => {
    expect(playerHasScoutingEligibleMinutes(mockPlayer({ minutes: 89 }))).toBe(false)
    expect(playerHasScoutingEligibleMinutes(mockPlayer({ minutes: 90 }))).toBe(true)
  })

  it('calcula métricas per-90', () => {
    const m = extractPer90FromPlayer(mockPlayer())
    expect(m.goals90).toBeCloseTo(0.3, 1)
    expect(m.keyPasses90).toBeCloseTo(2, 0)
    expect(m.duelWinRate).toBeGreaterThan(0)
  })

  it('genera perfiles con índices compuestos', () => {
    const players = [
      mockPlayer({ playerId: 1, position: 'Midfielder', keyPasses: 30 }),
      mockPlayer({ playerId: 2, position: 'Midfielder', keyPasses: 10, minutes: 900 }),
      mockPlayer({ playerId: 3, position: 'Midfielder', keyPasses: 5, minutes: 900 }),
    ]
    const profiles = buildScoutingProfiles(players)
    expect(profiles.length).toBe(3)
    const top = profiles.find((p) => p.playerId === 1)!
    expect(top.metrics.offensiveIndex).toBeGreaterThan(0)
    expect(top.percentiles.keyPasses90).toBeGreaterThanOrEqual(66)
  })

  it('excluye jugadores con pocos minutos', () => {
    const profiles = buildScoutingProfiles([
      mockPlayer({ minutes: 45 }),
      mockPlayer({ playerId: 2, minutes: 200 }),
    ])
    expect(profiles.length).toBe(1)
  })
})

describe('positionMetricProfiles', () => {
  it('define perfiles para G/D/M/F', () => {
    expect(Object.keys(POSITION_METRIC_PROFILES)).toEqual(['M', 'F', 'D', 'G'])
    expect(scoutingPositionOptions().length).toBe(4)
  })
})

describe('scoutingMetricViews', () => {
  it('filtra vistas por posición', () => {
    const gkViews = getMetricViewsForPosition('G')
    expect(gkViews.some((v) => v.id === 'dribbles')).toBe(false)
    expect(gkViews.some((v) => v.id === 'defense')).toBe(true)
  })

  it('resuelve scatter por defecto', () => {
    const cfg = resolveScatterConfig('F', 'default')
    expect(cfg.x.key).toBe('goals90')
  })
})

describe('SCOUTING_MIN_MINUTES', () => {
  it('es 90', () => {
    expect(SCOUTING_MIN_MINUTES).toBe(90)
  })
})
