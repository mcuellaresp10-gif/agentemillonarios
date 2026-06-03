import { mergePlayerStatistics } from '@/services/playerMerge'
import type { PlayerSeasonStats } from '@/types'

export function hasMeaningfulStats(p: PlayerSeasonStats | null | undefined): boolean {
  if (!p) return false
  return (
    p.appearances > 0 ||
    p.minutes > 0 ||
    (p.ratingAvg != null && p.ratingAvg > 0) ||
    (p.saves != null && p.saves > 0)
  )
}

/** Elige el mejor registro por minutos; si empatan, merge de todos. */
export function pickBestPlayerStats(rows: PlayerSeasonStats[]): PlayerSeasonStats | null {
  if (!rows.length) return null
  const meaningful = rows.filter(hasMeaningfulStats)
  if (!meaningful.length) return rows[0] ?? null

  if (meaningful.length === 1) return meaningful[0]!

  const merged = mergePlayerStatistics(meaningful)
  if (merged.length === 1) return merged[0]!

  return meaningful.reduce((best, cur) =>
    (cur.minutes ?? 0) > (best.minutes ?? 0) ? cur : best,
  )
}

export function pickBestFromGroups(
  groups: PlayerSeasonStats[][],
): PlayerSeasonStats | null {
  const flat = groups.flat()
  return pickBestPlayerStats(flat)
}
