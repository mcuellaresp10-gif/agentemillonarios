import type { PlayerSeasonStats, ScoutCandidate } from '@/types'
import { matchesPositionFilter, posicionEnEspanol } from '@/utils/positions'

function num(v: number | null | undefined, fallback = 0): number {
  return v != null && Number.isFinite(v) ? v : fallback
}

/** Filtro de posición sugerido al elegir un jugador de plantilla */
export function positionFilterFromPlayer(player: PlayerSeasonStats): string | undefined {
  const sources = [player.position, ...player.positionsPlayed]
  for (const raw of sources) {
    const p = raw.toLowerCase()
    if (p.includes('porter') || p === 'g' || p.includes('goal')) return 'Portero'
    if (p.includes('lateral') && (p.includes('d') || p.includes('der') || p.includes('right')))
      return 'Lateral D'
    if (p.includes('lateral') && (p.includes('i') || p.includes('izq') || p.includes('left')))
      return 'Lateral I'
    if (p.includes('central')) return 'Central'
    if (p.includes('defens') && p.includes('mid')) return 'Mediocampista Defensivo'
    if (p.includes('ofens') && p.includes('mid')) return 'Mediocampista Ofensivo'
    if (p.includes('extrem')) return 'Extremo'
    if (p.includes('delant') || p.includes('strik') || p.includes('forward') || p === 'f')
      return 'Delantero'
    if (p.includes('def') || p === 'd') return 'Defensa'
    if (p.includes('mid') || p === 'm' || p.includes('medio')) return 'Mediocampista'
  }
  return undefined
}

export function candidateMatchesPosition(
  candidate: ScoutCandidate,
  filter: string | undefined,
): boolean {
  if (!filter || filter === 'all') return true
  if (matchesPositionFilter(candidate.position, filter)) return true
  return candidate.positionsPlayed.some((p) => matchesPositionFilter(p, filter))
}

/** 0–100: qué tan bien encaja como reemplazo (más = mejor) */
export function replacementFitScore(
  candidate: ScoutCandidate,
  target: PlayerSeasonStats,
): number {
  const posFilter = positionFilterFromPlayer(target)
  let score = 0

  if (posFilter && candidateMatchesPosition(candidate, posFilter)) score += 35
  else if (matchesPositionFilter(candidate.position, target.position)) score += 18

  const ratingT = num(target.ratingAvg, 6.5)
  const ratingC = num(candidate.ratingAvg)
  if (ratingC >= ratingT) score += 25
  else score += Math.max(0, 25 * (ratingC / ratingT))

  const minsT = Math.max(target.minutes, 90)
  const minsC = candidate.minutes
  score += Math.min(15, (minsC / minsT) * 15)

  if (target.xG90 != null && target.xG90 > 0 && candidate.xG90 != null) {
    const ratio = candidate.xG90 / target.xG90
    score += Math.min(12, ratio >= 1 ? 12 : ratio * 12)
  } else if (candidate.xG90 != null && candidate.xG90 > 0) score += 6

  if (target.keyPasses != null && target.keyPasses > 0 && candidate.keyPasses != null) {
    score += Math.min(8, (candidate.keyPasses / target.keyPasses) * 8)
  }

  if (target.duelsWonPct != null && candidate.duelsWonPct != null) {
    const diff = candidate.duelsWonPct - target.duelsWonPct
    score += Math.min(5, diff >= 0 ? 5 : Math.max(0, 5 + diff / 10))
  }

  if (target.goals > 0) {
    score += Math.min(5, (candidate.goals / target.goals) * 5)
  }
  if (target.assists > 0) {
    score += Math.min(5, (candidate.assists / target.assists) * 5)
  }

  if (candidate.age != null && target.age != null) {
    const ageDiff = Math.abs(candidate.age - target.age)
    score += Math.max(0, 5 - ageDiff)
  }

  return Math.round(Math.min(100, score))
}

export function fitScoreLabel(score: number): string {
  if (score >= 75) return 'Muy alto'
  if (score >= 55) return 'Alto'
  if (score >= 40) return 'Medio'
  return 'Bajo'
}

function squadInPositionBucket(
  squad: PlayerSeasonStats[],
  candidate: ScoutCandidate,
  positionFilter?: string,
): PlayerSeasonStats[] {
  const bucket =
    positionFilter ?? positionFilterFromPlayer(candidate) ?? undefined
  if (!bucket) return squad
  return squad.filter((p) => candidateMatchesPosition(p as ScoutCandidate, bucket))
}

function pickBestByRating(players: PlayerSeasonStats[]): PlayerSeasonStats | null {
  if (!players.length) return null
  return [...players].sort(
    (a, b) =>
      (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0) || b.minutes - a.minutes,
  )[0]
}

function averageSquadProfile(players: PlayerSeasonStats[]): PlayerSeasonStats {
  const n = players.length
  const sum = (fn: (p: PlayerSeasonStats) => number) =>
    players.reduce((acc, p) => acc + fn(p), 0) / n
  const ref = players[0]
  return {
    ...ref,
    playerId: 0,
    name: 'Promedio plantilla',
    ratingAvg: sum((p) => p.ratingAvg ?? 0) || null,
    minutes: Math.round(sum((p) => p.minutes)),
    goals: Math.round(sum((p) => p.goals)),
    assists: Math.round(sum((p) => p.assists)),
    xG90:
      players.filter((p) => p.xG90 != null).length > 0
        ? sum((p) => p.xG90 ?? 0)
        : null,
    keyPasses:
      players.filter((p) => p.keyPasses != null).length > 0
        ? Math.round(sum((p) => p.keyPasses ?? 0))
        : null,
    duelsWonPct:
      players.filter((p) => p.duelsWonPct != null).length > 0
        ? Math.round(sum((p) => p.duelsWonPct ?? 0) * 10) / 10
        : null,
  }
}

/** Referente Millonarios para comparar un candidato (mejor en posición o promedio) */
export function findMillonariosReference(
  squad: PlayerSeasonStats[],
  candidate: ScoutCandidate,
  positionFilter?: string,
): PlayerSeasonStats {
  if (!squad.length) {
    return {
      playerId: 0,
      name: '—',
      photo: '',
      age: null,
      nationality: '',
      position: candidate.position,
      positionsPlayed: [],
      number: null,
      appearances: 0,
      minutes: 0,
      goals: 0,
      assists: 0,
      yellow: 0,
      red: 0,
      rating: null,
      ratingAvg: 6.5,
      xG: null,
      xG90: null,
      passes: null,
      passAccuracy: null,
      keyPasses: null,
      shotsTotal: null,
      shotsOn: null,
      duelsTotal: null,
      duelsWon: null,
      duelsWonPct: null,
      dribblesAttempted: null,
      dribblesSuccess: null,
      tackles: null,
      interceptions: null,
      foulsDrawn: null,
      foulsCommitted: null,
      saves: null,
      conceded: null,
      teamId: 0,
      teamName: 'Millonarios',
    }
  }

  const inBucket = squadInPositionBucket(squad, candidate, positionFilter)
  const bestInPos = pickBestByRating(inBucket)
  if (bestInPos) return bestInPos

  const bestGlobal = pickBestByRating(squad)
  if (bestGlobal) return bestGlobal

  return averageSquadProfile(inBucket.length ? inBucket : squad)
}

export function millonariosFitScore(
  candidate: ScoutCandidate,
  squad: PlayerSeasonStats[],
  positionFilter?: string,
): number {
  const reference = findMillonariosReference(squad, candidate, positionFilter)
  return replacementFitScore(candidate, reference)
}

export function getAffinityReferenceLabel(
  reference: PlayerSeasonStats,
  isDirectReplace: boolean,
): string {
  if (isDirectReplace) return `Afinidad vs ${reference.name}`
  const pos = posicionEnEspanol(reference.position)
  if (reference.name === 'Promedio plantilla') {
    return `Afinidad vs promedio Millonarios (${pos})`
  }
  return `Afinidad vs referencia Millonarios: ${reference.name} (${pos})`
}
