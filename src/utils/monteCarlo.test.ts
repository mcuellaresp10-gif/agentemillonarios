import { describe, expect, it } from 'vitest'
import { applyMultiplier } from '@/utils/monteCarlo'

describe('monteCarlo', () => {
  it('applyMultiplier mantiene suma W+D+L = 1', () => {
    const base = { winRate: 0.4, drawRate: 0.28, loseRate: 0.32 }
    const opt = applyMultiplier(base, 1.5)
    expect(opt.winRate + opt.drawRate + opt.loseRate).toBeCloseTo(1, 5)
    expect(opt.winRate).toBeGreaterThan(base.winRate)
  })

  it('applyMultiplier pesimista reduce winRate', () => {
    const base = { winRate: 0.4, drawRate: 0.28, loseRate: 0.32 }
    const pes = applyMultiplier(base, 0.5)
    expect(pes.winRate).toBeLessThan(base.winRate)
  })
})
