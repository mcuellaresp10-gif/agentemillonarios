import type { PlayerSeasonStats } from '@/types'

export interface RadarAxis3 {
  axis: string
  jugador: number
  colombia: number
  sudamerica: number
}

export interface PercentileInfo {
  colombiaPercentile: number // 0-100, % de jugadores COL por debajo del jugador
  saPercentile: number       // 0-100, % de jugadores SA por debajo del jugador
}

export interface RankingBenchmarks {
  radar: RadarAxis3[]
  percentiles: Record<string, PercentileInfo> // clave = axis label
  poolSize: number
  colombiaPoolSize: number
}

const COLOMBIA_LEAGUE_ID = 239

type PosBucket = 'GK' | 'DEF' | 'MID' | 'FWD'

function getPosBucket(pos: string): PosBucket {
  const p = pos.toUpperCase()
  if (['G', 'GK', 'GOALKEEPER', 'PORTERO'].includes(p)) return 'GK'
  if (
    ['CB', 'DC', 'LB', 'RB', 'LWB', 'RWB', 'WB', 'D', 'DEFENDER'].includes(p) ||
    p.includes('CENTRAL') || p.includes('LATERAL') || p.includes('DEFENS')
  )
    return 'DEF'
  if (['ST', 'CF', 'FW', 'ATT', 'SS', 'F', 'ATTACKER'].includes(p) || p.includes('DELANT'))
    return 'FWD'
  return 'MID'
}

function safeNum(v: number | null | undefined): number {
  return v != null && Number.isFinite(v) ? v : 0
}

function mean(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((a, b) => a + b, 0) / values.length
}

interface MetricDef {
  axis: string
  getValue: (p: PlayerSeasonStats) => number
  higherIsBetter: boolean
  /** Máximo absoluto fijo — el "techo" de referencia independiente del pool */
  fixedMax: number
}

/**
 * Máximos fijos por métrica (escala de temporada completa ~38 partidos).
 * Un jugador de élite mundial rondaría el 85-90% de estos valores;
 * el jugador promedio de SA rondaría el 40-60%.
 */
function getMetrics(bucket: PosBucket): MetricDef[] {
  if (bucket === 'GK') {
    return [
      // Rating API-Football: escala 0–10
      { axis: 'Rating', getValue: (p) => safeNum(p.rating ?? p.ratingAvg), higherIsBetter: true, fixedMax: 9.0 },
      // Minutos: temporada completa titular = ~3400 min
      { axis: 'Participación', getValue: (p) => safeNum(p.minutes), higherIsBetter: true, fixedMax: 3400 },
      // Atajadas: portero muy activo puede hacer 120+ en temporada
      { axis: 'Atajadas', getValue: (p) => safeNum(p.saves), higherIsBetter: true, fixedMax: 120 },
      // Goles encajados: less = better; 0 goles encajados = 100, 60 = 0
      { axis: 'Goles enc.', getValue: (p) => safeNum(p.conceded), higherIsBetter: false, fixedMax: 60 },
      // Precisión de pases: % (0–100)
      { axis: 'Pases (%)', getValue: (p) => safeNum(p.passAccuracy), higherIsBetter: true, fixedMax: 90 },
      // % duelos ganados (0–100)
      { axis: 'Duelos', getValue: (p) => safeNum(p.duelsWonPct), higherIsBetter: true, fixedMax: 75 },
    ]
  }
  return [
    // Rating API-Football: escala 0–10
    { axis: 'Rating', getValue: (p) => safeNum(p.rating ?? p.ratingAvg), higherIsBetter: true, fixedMax: 9.0 },
    // Minutos: temporada completa titular ~3400 min
    { axis: 'Participación', getValue: (p) => safeNum(p.minutes), higherIsBetter: true, fixedMax: 3400 },
    // Producción: delantero top ~25 goles + 12 asistencias + xG alto → ≈35
    { axis: 'Producción', getValue: (p) => safeNum(p.goals) + safeNum(p.assists) * 0.7 + safeNum(p.xG90) * 0.5, higherIsBetter: true, fixedMax: 35 },
    // Creación: keyPasses temporada ~80 + passAccuracy%*0.04 ~3.5 → ≈83
    { axis: 'Creación', getValue: (p) => safeNum(p.keyPasses) + safeNum(p.passAccuracy) * 0.04, higherIsBetter: true, fixedMax: 85 },
    // % duelos ganados: los mejores duellistas rondan 65%
    { axis: 'Duelos', getValue: (p) => safeNum(p.duelsWonPct), higherIsBetter: true, fixedMax: 65 },
    // Defensa: tackles + intercepciones, top defensor ≈ 120 en temporada
    { axis: 'Defensa', getValue: (p) => safeNum(p.tackles) + safeNum(p.interceptions), higherIsBetter: true, fixedMax: 120 },
  ]
}

export function computeRankingBenchmarks(
  player: PlayerSeasonStats,
  allLeaguePlayers: PlayerSeasonStats[],
): RankingBenchmarks {
  const bucket = getPosBucket(player.position)

  // Pool filtrado al mismo bucket con al menos 45 minutos
  const pool = allLeaguePlayers.filter(
    (p) => getPosBucket(p.position) === bucket && safeNum(p.minutes) > 45,
  )
  const colombiaPool = pool.filter((p) => p.leagueId === COLOMBIA_LEAGUE_ID)

  const metrics = getMetrics(bucket)
  const radar: RadarAxis3[] = []
  const percentiles: Record<string, PercentileInfo> = {}

  for (const metric of metrics) {
    const rawPool = pool.map((p) => metric.getValue(p))
    const rawColombia = colombiaPool.map((p) => metric.getValue(p))

    // Normalizar con máximo fijo absoluto — el radar siempre usa la misma escala
    const maxVal = metric.fixedMax || 1
    const normalize = (raw: number) => Math.min(raw / maxVal, 1) * 100
    const maybeInvert = (score: number) => (metric.higherIsBetter ? score : 100 - score)

    const playerScore = maybeInvert(normalize(metric.getValue(player)))

    const poolScores = rawPool.map((v) => maybeInvert(normalize(v)))
    const colScores = rawColombia.map((v) => maybeInvert(normalize(v)))

    const saAvg = mean(poolScores)
    const colAvg = colScores.length > 0 ? mean(colScores) : saAvg

    const saPercentile =
      poolScores.length > 0
        ? (poolScores.filter((s) => s < playerScore).length / poolScores.length) * 100
        : 50
    const colombiaPercentile =
      colScores.length > 0
        ? (colScores.filter((s) => s < playerScore).length / colScores.length) * 100
        : 50

    radar.push({
      axis: metric.axis,
      jugador: Math.round(playerScore),
      colombia: Math.round(colAvg),
      sudamerica: Math.round(saAvg),
    })

    percentiles[metric.axis] = {
      colombiaPercentile: Math.round(colombiaPercentile),
      saPercentile: Math.round(saPercentile),
    }
  }

  return {
    radar,
    percentiles,
    poolSize: pool.length,
    colombiaPoolSize: colombiaPool.length,
  }
}
