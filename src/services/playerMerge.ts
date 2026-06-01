import { avgRating, xgPer90 } from '@/utils/calculators'
import type { PlayerSeasonStats } from '@/types'

function pickPrimaryPosition(positions: string[]): string {
  const counts = new Map<string, number>()
  for (const p of positions) {
    const k = p.trim()
    if (k && k !== '—') counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  let best = '—'
  let max = 0
  for (const [p, c] of counts) {
    if (c > max) {
      max = c
      best = p
    }
  }
  return best
}

/** Une registros duplicados (Liga + copas) en un solo jugador */
export function mergePlayerStatistics(
  rows: PlayerSeasonStats[],
): PlayerSeasonStats[] {
  const map = new Map<number, PlayerSeasonStats[]>()
  for (const r of rows) {
    if (!map.has(r.playerId)) map.set(r.playerId, [])
    map.get(r.playerId)!.push(r)
  }

  const merged: PlayerSeasonStats[] = []

  for (const [, group] of map) {
    const base = group[0]!
    const positionsPlayed = [
      ...new Set(group.flatMap((g) => g.positionsPlayed ?? [g.position])),
    ]
    const ratings = group
      .map((g) => g.ratingAvg)
      .filter((r): r is number => r != null && r > 0)

    const sum = {
      appearances: 0,
      minutes: 0,
      goals: 0,
      assists: 0,
      yellow: 0,
      red: 0,
      xG: 0,
      passes: 0,
      keyPasses: 0,
      shotsTotal: 0,
      shotsOn: 0,
      duelsTotal: 0,
      duelsWon: 0,
      dribblesAttempted: 0,
      dribblesSuccess: 0,
      tackles: 0,
      interceptions: 0,
      foulsDrawn: 0,
      foulsCommitted: 0,
      saves: 0,
      conceded: 0,
    }

    let passAccWeighted = 0
    let passAccWeight = 0

    for (const g of group) {
      sum.appearances += g.appearances
      sum.minutes += g.minutes
      sum.goals += g.goals
      sum.assists += g.assists
      sum.yellow += g.yellow
      sum.red += g.red
      sum.xG += g.xG ?? 0
      sum.passes += g.passes ?? 0
      sum.keyPasses += g.keyPasses ?? 0
      sum.shotsTotal += g.shotsTotal ?? 0
      sum.shotsOn += g.shotsOn ?? 0
      sum.duelsTotal += g.duelsTotal ?? 0
      sum.duelsWon += g.duelsWon ?? 0
      sum.dribblesAttempted += g.dribblesAttempted ?? 0
      sum.dribblesSuccess += g.dribblesSuccess ?? 0
      sum.tackles += g.tackles ?? 0
      sum.interceptions += g.interceptions ?? 0
      sum.foulsDrawn += g.foulsDrawn ?? 0
      sum.foulsCommitted += g.foulsCommitted ?? 0
      sum.saves += g.saves ?? 0
      sum.conceded += g.conceded ?? 0
      if (g.passAccuracy != null && g.passes) {
        passAccWeighted += g.passAccuracy * g.passes
        passAccWeight += g.passes
      }
    }

    const duelsWonPct =
      sum.duelsTotal > 0
        ? Math.round((sum.duelsWon / sum.duelsTotal) * 1000) / 10
        : null

    merged.push({
      ...base,
      position: pickPrimaryPosition(positionsPlayed),
      positionsPlayed,
      appearances: sum.appearances,
      minutes: sum.minutes,
      goals: sum.goals,
      assists: sum.assists,
      yellow: sum.yellow,
      red: sum.red,
      ratingAvg: avgRating(ratings),
      xG: sum.xG > 0 ? Math.round(sum.xG * 100) / 100 : null,
      xG90:
        sum.xG > 0 && sum.minutes > 0 ? xgPer90(sum.xG, sum.minutes) : null,
      passes: sum.passes || null,
      passAccuracy:
        passAccWeight > 0
          ? Math.round((passAccWeighted / passAccWeight) * 10) / 10
          : null,
      keyPasses: sum.keyPasses || null,
      shotsTotal: sum.shotsTotal || null,
      shotsOn: sum.shotsOn || null,
      duelsTotal: sum.duelsTotal || null,
      duelsWon: sum.duelsWon || null,
      duelsWonPct,
      dribblesAttempted: sum.dribblesAttempted || null,
      dribblesSuccess: sum.dribblesSuccess || null,
      tackles: sum.tackles || null,
      interceptions: sum.interceptions || null,
      foulsDrawn: sum.foulsDrawn || null,
      foulsCommitted: sum.foulsCommitted || null,
      saves: sum.saves || null,
      conceded: sum.conceded || null,
    })
  }

  return merged
}
