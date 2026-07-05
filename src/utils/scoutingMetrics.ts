import type { MetricKey, ScoutingPosition } from '@/config/positionMetricProfiles'
import { getPositionProfile } from '@/config/positionMetricProfiles'
import type { PlayerSeasonStats } from '@/types'
import { positionToCode } from '@/utils/positions'

export const SCOUTING_MIN_MINUTES = 90

export interface Per90Metrics {
  goals90: number
  assists90: number
  keyPasses90: number
  shots90: number
  shotsOn90: number
  dribblesSuccess90: number
  dribblesAttempts90: number
  dribbleSuccessRate: number
  shotOnTargetRate: number
  tackles90: number
  interceptions90: number
  blocks90: number
  duelsWon90: number
  duelWinRate: number
  foulsDrawn90: number
  foulsCommitted90: number
  passes90: number
  passAccuracy: number
  saves90: number
  conceded90: number
  savePercentage: number
  rating: number
  minutes: number
  appearances: number
  offensiveIndex: number
  finishingIndex: number
  defensiveIndex: number
  goalkeeperIndex: number
}

export interface ScoutingProfile {
  playerId: number
  name: string
  photo: string
  team: string
  teamLogo?: string
  position: ScoutingPosition
  positionRaw: string
  minutes: number
  rating: number
  goals: number
  assists: number
  leagueLabel?: string
  metrics: Per90Metrics
  percentiles: Partial<Record<MetricKey, number>>
  radarValues: Record<string, number>
  radarPeerAverage: Record<string, number>
}

function num(v: number | null | undefined, fallback = 0): number {
  return v != null && Number.isFinite(v) ? v : fallback
}

function per90(value: number, minutes: number): number {
  if (minutes <= 0) return 0
  return (value / minutes) * 90
}

function rate(numerator: number, denominator: number, fallback = 0): number {
  if (denominator <= 0) return fallback
  return numerator / denominator
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function round1(value: number): number {
  return Math.round(value * 10) / 10
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function extractPer90FromPlayer(player: PlayerSeasonStats): Per90Metrics {
  const minutes = player.minutes
  const dribbleAttempts = num(player.dribblesAttempted)
  const dribbleSuccess = num(player.dribblesSuccess)
  const duelsTotal = num(player.duelsTotal)
  const duelsWon = num(player.duelsWon)
  const saves = num(player.saves)
  const conceded = num(player.conceded)
  const shotsOn = num(player.shotsOn)
  const shotsTotal = num(player.shotsTotal)
  const keyPasses = num(player.keyPasses)
  const foulsDrawn = num(player.foulsDrawn)

  return {
    goals90: round2(per90(player.goals, minutes)),
    assists90: round2(per90(player.assists, minutes)),
    keyPasses90: round2(per90(keyPasses, minutes)),
    shots90: round2(per90(shotsTotal, minutes)),
    shotsOn90: round2(per90(shotsOn, minutes)),
    dribblesSuccess90: round2(per90(dribbleSuccess, minutes)),
    dribblesAttempts90: round2(per90(dribbleAttempts, minutes)),
    dribbleSuccessRate: round1(rate(dribbleSuccess, dribbleAttempts) * 100),
    shotOnTargetRate: round1(rate(shotsOn, shotsTotal) * 100),
    tackles90: round2(per90(num(player.tackles), minutes)),
    interceptions90: round2(per90(num(player.interceptions), minutes)),
    blocks90: 0,
    duelsWon90: round2(per90(duelsWon, minutes)),
    duelWinRate: round1(rate(duelsWon, duelsTotal) * 100),
    foulsDrawn90: round2(per90(foulsDrawn, minutes)),
    foulsCommitted90: round2(per90(num(player.foulsCommitted), minutes)),
    passes90: round2(per90(num(player.passes), minutes)),
    passAccuracy: round1(num(player.passAccuracy)),
    saves90: round2(per90(saves, minutes)),
    conceded90: round2(per90(conceded, minutes)),
    savePercentage: round1(rate(saves, saves + conceded) * 100),
    rating: num(player.ratingAvg, num(player.rating, 6.5)),
    minutes,
    appearances: player.appearances,
    offensiveIndex: 0,
    finishingIndex: 0,
    defensiveIndex: 0,
    goalkeeperIndex: 0,
  }
}

function percentileRank(values: number[], value: number): number {
  if (values.length === 0) return 50
  const below = values.filter((v) => v < value).length
  return Math.round((below / values.length) * 100)
}

function normalizeToTen(values: number[], value: number): number {
  if (values.length === 0) return 5
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (max === min) return 5
  return round1(((value - min) / (max - min)) * 10)
}

function metricValue(metrics: Per90Metrics, key: MetricKey): number {
  return metrics[key as keyof Per90Metrics] as number
}

function computeCompositeIndices(
  metrics: Per90Metrics,
  position: ScoutingPosition,
  poolMetrics: Per90Metrics[],
): Per90Metrics {
  const offensiveParts = [
    normalizeToTen(poolMetrics.map((m) => m.keyPasses90), metrics.keyPasses90),
    normalizeToTen(poolMetrics.map((m) => m.shotsOn90), metrics.shotsOn90),
    normalizeToTen(poolMetrics.map((m) => m.dribblesSuccess90), metrics.dribblesSuccess90),
    normalizeToTen(poolMetrics.map((m) => m.foulsDrawn90), metrics.foulsDrawn90),
  ]
  const finishingParts = [
    normalizeToTen(poolMetrics.map((m) => m.goals90), metrics.goals90),
    normalizeToTen(poolMetrics.map((m) => m.shotsOn90), metrics.shotsOn90),
    normalizeToTen(poolMetrics.map((m) => m.dribblesSuccess90), metrics.dribblesSuccess90),
    normalizeToTen(poolMetrics.map((m) => m.keyPasses90), metrics.keyPasses90),
  ]
  const defensiveParts = [
    normalizeToTen(poolMetrics.map((m) => m.duelsWon90), metrics.duelsWon90),
    normalizeToTen(poolMetrics.map((m) => m.tackles90), metrics.tackles90),
    normalizeToTen(poolMetrics.map((m) => m.interceptions90), metrics.interceptions90),
    normalizeToTen(poolMetrics.map((m) => m.duelWinRate), metrics.duelWinRate),
  ]
  const gkParts = [
    normalizeToTen(poolMetrics.map((m) => m.saves90), metrics.saves90),
    normalizeToTen(poolMetrics.map((m) => m.savePercentage), metrics.savePercentage),
    normalizeToTen(poolMetrics.map((m) => m.duelsWon90), metrics.duelsWon90),
    normalizeToTen(poolMetrics.map((m) => m.passAccuracy), metrics.passAccuracy),
  ]
  const avg = (parts: number[]) =>
    round1(parts.reduce((s, p) => s + p, 0) / Math.max(parts.length, 1))

  return {
    ...metrics,
    offensiveIndex: position === 'M' ? avg(offensiveParts) : metrics.offensiveIndex,
    finishingIndex: position === 'F' ? avg(finishingParts) : metrics.finishingIndex,
    defensiveIndex: position === 'D' ? avg(defensiveParts) : metrics.defensiveIndex,
    goalkeeperIndex: position === 'G' ? avg(gkParts) : metrics.goalkeeperIndex,
  }
}

function buildRadarValues(
  metrics: Per90Metrics,
  position: ScoutingPosition,
  poolMetrics: Per90Metrics[],
): { player: Record<string, number>; peer: Record<string, number> } {
  const profile = getPositionProfile(position)
  const player: Record<string, number> = {}
  const peer: Record<string, number> = {}

  for (const axis of profile.radarAxes) {
    const poolValues = poolMetrics.map((m) => metricValue(m, axis.key))
    const raw = metricValue(metrics, axis.key)

    if (axis.isComposite || axis.key.endsWith('Index')) {
      player[axis.key] = raw
      peer[axis.key] = poolValues.length
        ? round1(poolValues.reduce((s, v) => s + v, 0) / poolValues.length)
        : 5
    } else if (axis.isRate) {
      player[axis.key] = normalizeToTen(poolValues, raw)
      peer[axis.key] = 5
    } else {
      player[axis.key] = normalizeToTen(poolValues, raw)
      peer[axis.key] = 5
    }
  }

  return { player, peer }
}

export function playerHasScoutingEligibleMinutes(player: PlayerSeasonStats): boolean {
  return player.minutes >= SCOUTING_MIN_MINUTES
}

export function getScoutingPosition(player: PlayerSeasonStats): ScoutingPosition {
  const pos = player.position || player.positionsPlayed[0] || 'M'
  const code = positionToCode(pos)
  if (code === 'G' || code === 'D' || code === 'M' || code === 'F') return code
  return 'M'
}

export function buildScoutingProfiles(players: PlayerSeasonStats[]): ScoutingProfile[] {
  const eligible = players.filter(playerHasScoutingEligibleMinutes)
  const byPosition = new Map<
    ScoutingPosition,
    { player: PlayerSeasonStats; base: Per90Metrics }[]
  >()

  for (const player of eligible) {
    const position = getScoutingPosition(player)
    const base = extractPer90FromPlayer(player)
    const list = byPosition.get(position) ?? []
    list.push({ player, base })
    byPosition.set(position, list)
  }

  const profiles: ScoutingProfile[] = []

  for (const [position, entries] of byPosition) {
    const poolMetrics = entries.map((e) => e.base)
    const withComposites = poolMetrics.map((m) =>
      computeCompositeIndices(m, position, poolMetrics),
    )
    const profileConfig = getPositionProfile(position)

    for (let i = 0; i < entries.length; i += 1) {
      const { player } = entries[i]
      const metrics = withComposites[i]
      const percentiles: Partial<Record<MetricKey, number>> = {}

      for (const axis of profileConfig.radarAxes) {
        const values = withComposites.map((m) => metricValue(m, axis.key))
        percentiles[axis.key] = percentileRank(values, metricValue(metrics, axis.key))
      }

      for (const axis of [
        profileConfig.scatter.x,
        profileConfig.scatter.y,
        profileConfig.scatter.color,
      ]) {
        const values = withComposites.map((m) => metricValue(m, axis.key))
        percentiles[axis.key] = percentileRank(values, metricValue(metrics, axis.key))
      }

      const radar = buildRadarValues(metrics, position, withComposites)

      profiles.push({
        playerId: player.playerId,
        name: player.name,
        photo: player.photo,
        team: player.teamName,
        position,
        positionRaw: player.position,
        minutes: metrics.minutes,
        rating: metrics.rating,
        goals: player.goals,
        assists: player.assists,
        leagueLabel: player.leagueLabel,
        metrics,
        percentiles,
        radarValues: radar.player,
        radarPeerAverage: radar.peer,
      })
    }
  }

  return profiles
}

export function buildScoutingProfileForPlayer(
  player: PlayerSeasonStats,
  allPlayers: PlayerSeasonStats[],
): ScoutingProfile | null {
  const profiles = buildScoutingProfiles(allPlayers)
  return profiles.find((p) => p.playerId === player.playerId) ?? null
}

export function scatterColorPercent(value: number, min = 0, max = 100): string {
  const t = clamp((value - min) / Math.max(max - min, 1), 0, 1)
  const r = Math.round(239 - t * 180)
  const g = Math.round(68 + t * 120)
  const b = Math.round(68 + t * 40)
  return `rgb(${r},${g},${b})`
}

export function profilesForPosition(
  profiles: ScoutingProfile[],
  position: ScoutingPosition,
): ScoutingProfile[] {
  return profiles.filter((p) => p.position === position)
}

export function getScatterPoint(
  profile: ScoutingProfile,
  xKey: MetricKey,
  yKey: MetricKey,
  colorKey: MetricKey,
) {
  return {
    id: profile.playerId,
    name: profile.name,
    photo: profile.photo,
    team: profile.team,
    x: metricValue(profile.metrics, xKey),
    y: metricValue(profile.metrics, yKey),
    color: metricValue(profile.metrics, colorKey),
  }
}

export function peerAverageRadarFromPool(
  profiles: ScoutingProfile[],
  position: ScoutingPosition,
  excludeId?: number,
): Record<string, number> | null {
  const peers = profiles.filter((p) => p.position === position && p.playerId !== excludeId)
  if (peers.length === 0) return null

  const positionProfile = getPositionProfile(position)
  const out: Record<string, number> = {}

  for (const axis of positionProfile.radarAxes) {
    const values = peers.map((p) => p.radarValues[axis.key] ?? 0)
    out[axis.key] = Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10
  }

  return out
}

export function syntheticPeerProfile(
  radarValues: Record<string, number>,
  position: ScoutingPosition,
  profile: ScoutingProfile,
): ScoutingProfile {
  return { ...profile, radarValues, playerId: -1, name: 'Promedio del resto', position }
}
