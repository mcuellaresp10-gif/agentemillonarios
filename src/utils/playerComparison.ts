import type { PlayerSeasonStats } from '@/types'
import { positionFilterFromPlayer } from '@/utils/scoutReplacement'
import { posicionEnEspanol } from '@/utils/positions'

export type ComparisonSide = 'candidato' | 'actual'
export type MetricWinner = ComparisonSide | 'tie' | 'na'

export interface ComparisonRow {
  id: string
  label: string
  candidato: string | number
  actual: string | number
  winner: MetricWinner
  weight: number
  isRating?: boolean
}

export interface ComparisonCategory {
  id: string
  label: string
  candidatoScore: number
  actualScore: number
  edgeStrength: number
  winner: ComparisonSide | 'tie'
}

export interface RadarAxis {
  axis: string
  candidato: number
  actual: number
}

export interface PlayerComparisonResult {
  compositeScore: { candidato: number; actual: number }
  metricWins: { candidato: number; actual: number; tied: number; total: number }
  rows: ComparisonRow[]
  categories: ComparisonCategory[]
  radar: RadarAxis[]
  verdict: ComparisonSide | 'tie'
  verdictText: string
}

type PositionBucket = 'Portero' | 'Defensa' | 'Medio' | 'Ataque' | 'Default'

interface MetricDef {
  id: string
  label: string
  categoryId: string
  getValue: (p: PlayerSeasonStats) => number | null
  format: (v: number | null) => string | number
  higherIsBetter: boolean
  weightByBucket: Record<PositionBucket, number>
  isRating?: boolean
}

const METRICS: MetricDef[] = [
  {
    id: 'rating',
    label: 'Rating',
    categoryId: 'general',
    getValue: (p) => p.ratingAvg,
    format: (v) => (v != null ? v.toFixed(1) : '—'),
    higherIsBetter: true,
    weightByBucket: { Portero: 15, Defensa: 12, Medio: 12, Ataque: 10, Default: 12 },
    isRating: true,
  },
  {
    id: 'appearances',
    label: 'Partidos',
    categoryId: 'participacion',
    getValue: (p) => p.appearances,
    format: (v) => v ?? '—',
    higherIsBetter: true,
    weightByBucket: { Portero: 10, Defensa: 8, Medio: 8, Ataque: 8, Default: 8 },
  },
  {
    id: 'minutes',
    label: 'Minutos',
    categoryId: 'participacion',
    getValue: (p) => p.minutes,
    format: (v) => v ?? '—',
    higherIsBetter: true,
    weightByBucket: { Portero: 10, Defensa: 8, Medio: 8, Ataque: 8, Default: 8 },
  },
  {
    id: 'goals',
    label: 'Goles',
    categoryId: 'produccion',
    getValue: (p) => p.goals,
    format: (v) => v ?? '—',
    higherIsBetter: true,
    weightByBucket: { Portero: 0, Defensa: 3, Medio: 8, Ataque: 22, Default: 10 },
  },
  {
    id: 'assists',
    label: 'Asistencias',
    categoryId: 'produccion',
    getValue: (p) => p.assists,
    format: (v) => v ?? '—',
    higherIsBetter: true,
    weightByBucket: { Portero: 0, Defensa: 3, Medio: 10, Ataque: 18, Default: 10 },
  },
  {
    id: 'xG90',
    label: 'xG / 90',
    categoryId: 'produccion',
    getValue: (p) => p.xG90,
    format: (v) => (v != null ? v.toFixed(2) : '—'),
    higherIsBetter: true,
    weightByBucket: { Portero: 0, Defensa: 2, Medio: 8, Ataque: 20, Default: 10 },
  },
  {
    id: 'shotsOn',
    label: 'Tiros a puerta',
    categoryId: 'produccion',
    getValue: (p) => p.shotsOn,
    format: (v) => v ?? '—',
    higherIsBetter: true,
    weightByBucket: { Portero: 0, Defensa: 2, Medio: 6, Ataque: 15, Default: 8 },
  },
  {
    id: 'keyPasses',
    label: 'Pases clave',
    categoryId: 'creacion',
    getValue: (p) => p.keyPasses,
    format: (v) => v ?? '—',
    higherIsBetter: true,
    weightByBucket: { Portero: 2, Defensa: 6, Medio: 18, Ataque: 12, Default: 10 },
  },
  {
    id: 'passAccuracy',
    label: '% Pases',
    categoryId: 'creacion',
    getValue: (p) => p.passAccuracy,
    format: (v) => (v != null ? `${v}%` : '—'),
    higherIsBetter: true,
    weightByBucket: { Portero: 15, Defensa: 12, Medio: 12, Ataque: 6, Default: 10 },
  },
  {
    id: 'duelsWonPct',
    label: '% Duelos',
    categoryId: 'duelos',
    getValue: (p) => p.duelsWonPct,
    format: (v) => (v != null ? `${v}%` : '—'),
    higherIsBetter: true,
    weightByBucket: { Portero: 8, Defensa: 15, Medio: 12, Ataque: 10, Default: 10 },
  },
  {
    id: 'dribblesSuccess',
    label: 'Regates',
    categoryId: 'duelos',
    getValue: (p) => p.dribblesSuccess,
    format: (v) => v ?? '—',
    higherIsBetter: true,
    weightByBucket: { Portero: 0, Defensa: 4, Medio: 10, Ataque: 12, Default: 8 },
  },
  {
    id: 'tackles',
    label: 'Entradas',
    categoryId: 'defensa',
    getValue: (p) => p.tackles,
    format: (v) => v ?? '—',
    higherIsBetter: true,
    weightByBucket: { Portero: 2, Defensa: 18, Medio: 12, Ataque: 3, Default: 10 },
  },
  {
    id: 'interceptions',
    label: 'Intercepciones',
    categoryId: 'defensa',
    getValue: (p) => p.interceptions,
    format: (v) => v ?? '—',
    higherIsBetter: true,
    weightByBucket: { Portero: 2, Defensa: 15, Medio: 10, Ataque: 2, Default: 8 },
  },
  {
    id: 'saves',
    label: 'Atajadas',
    categoryId: 'porteria',
    getValue: (p) => p.saves,
    format: (v) => v ?? '—',
    higherIsBetter: true,
    weightByBucket: { Portero: 25, Defensa: 0, Medio: 0, Ataque: 0, Default: 2 },
  },
  {
    id: 'conceded',
    label: 'Goles encajados',
    categoryId: 'porteria',
    getValue: (p) => p.conceded,
    format: (v) => v ?? '—',
    higherIsBetter: false,
    weightByBucket: { Portero: 20, Defensa: 4, Medio: 0, Ataque: 0, Default: 2 },
  },
  {
    id: 'yellow',
    label: 'Amarillas',
    categoryId: 'disciplina',
    getValue: (p) => p.yellow,
    format: (v) => v ?? '—',
    higherIsBetter: false,
    weightByBucket: { Portero: 2, Defensa: 3, Medio: 3, Ataque: 3, Default: 3 },
  },
  {
    id: 'red',
    label: 'Rojas',
    categoryId: 'disciplina',
    getValue: (p) => p.red,
    format: (v) => v ?? '—',
    higherIsBetter: false,
    weightByBucket: { Portero: 2, Defensa: 2, Medio: 2, Ataque: 2, Default: 2 },
  },
]

const CATEGORY_LABELS: Record<string, string> = {
  participacion: 'Participación',
  produccion: 'Producción',
  creacion: 'Creación',
  duelos: 'Duelos',
  defensa: 'Defensa',
  porteria: 'Portería',
  disciplina: 'Disciplina',
  general: 'General',
}

function resolveBucket(player: PlayerSeasonStats): PositionBucket {
  const filter = positionFilterFromPlayer(player)
  if (filter === 'Portero') return 'Portero'
  if (
    filter === 'Central' ||
    filter === 'Lateral D' ||
    filter === 'Lateral I' ||
    filter === 'Defensa'
  ) {
    return 'Defensa'
  }
  if (
    filter === 'Mediocampista Defensivo' ||
    filter === 'Mediocampista Ofensivo' ||
    filter === 'Mediocampista' ||
    filter === 'Extremo'
  ) {
    return 'Medio'
  }
  if (filter === 'Delantero') return 'Ataque'
  return 'Default'
}

function hasValue(v: number | null | undefined): boolean {
  return v != null && Number.isFinite(v)
}

function metricComparable(a: number | null, b: number | null): boolean {
  const aOk = hasValue(a)
  const bOk = hasValue(b)
  if (!aOk && !bOk) return false
  if (aOk && a! > 0) return true
  if (bOk && b! > 0) return true
  if (aOk && bOk) return true
  return aOk || bOk
}

function normalizePair(
  a: number | null,
  b: number | null,
  higherIsBetter: boolean,
): { normA: number; normB: number; winner: MetricWinner } {
  if (!metricComparable(a, b)) {
    return { normA: 0.5, normB: 0.5, winner: 'na' }
  }

  let vA = a ?? 0
  let vB = b ?? 0

  if (!higherIsBetter) {
    const max = Math.max(vA, vB, 1)
    vA = max - vA
    vB = max - vB
  }

  const sum = vA + vB
  if (sum === 0) {
    return { normA: 0.5, normB: 0.5, winner: 'tie' }
  }

  const normA = vA / sum
  const normB = vB / sum
  const eps = 0.02
  let winner: MetricWinner = 'tie'
  if (normA - normB > eps) winner = 'candidato'
  else if (normB - normA > eps) winner = 'actual'

  return { normA, normB, winner }
}

function mergeBuckets(a: PlayerSeasonStats, b: PlayerSeasonStats): PositionBucket {
  const ba = resolveBucket(a)
  const bb = resolveBucket(b)
  if (ba === bb) return ba
  if (ba === 'Portero' || bb === 'Portero') return 'Portero'
  if (ba === 'Ataque' || bb === 'Ataque') return 'Ataque'
  if (ba === 'Defensa' || bb === 'Defensa') return 'Defensa'
  return 'Default'
}

export function comparePlayers(
  candidato: PlayerSeasonStats,
  actual: PlayerSeasonStats,
): PlayerComparisonResult {
  const bucket = mergeBuckets(candidato, actual)

  const rows: ComparisonRow[] = [
    {
      id: 'position',
      label: 'Posición',
      candidato: posicionEnEspanol(candidato.position),
      actual: posicionEnEspanol(actual.position),
      winner: 'na',
      weight: 0,
    },
  ]

  let weightedA = 0
  let weightedB = 0
  let totalWeight = 0
  let winsC = 0
  let winsA = 0
  let tied = 0

  const categoryAcc = new Map<
    string,
    { candidato: number; actual: number; weight: number }
  >()

  for (const metric of METRICS) {
    const weight = metric.weightByBucket[bucket]
    if (weight <= 0) continue

    const rawA = metric.getValue(candidato)
    const rawB = metric.getValue(actual)
    if (!metricComparable(rawA, rawB)) continue

    const { normA, normB, winner } = normalizePair(rawA, rawB, metric.higherIsBetter)
    const partialWeight = rawA != null && rawB != null ? weight : weight * 0.6

    weightedA += normA * partialWeight
    weightedB += normB * partialWeight
    totalWeight += partialWeight

    if (winner === 'candidato') winsC++
    else if (winner === 'actual') winsA++
    else if (winner === 'tie') tied++

    rows.push({
      id: metric.id,
      label: metric.label,
      candidato: metric.format(rawA),
      actual: metric.format(rawB),
      winner,
      weight: partialWeight,
      isRating: metric.isRating,
    })

    const cat = categoryAcc.get(metric.categoryId) ?? {
      candidato: 0,
      actual: 0,
      weight: 0,
    }
    cat.candidato += normA * partialWeight
    cat.actual += normB * partialWeight
    cat.weight += partialWeight
    categoryAcc.set(metric.categoryId, cat)
  }

  const compositeRaw = {
    candidato: totalWeight > 0 ? (weightedA / totalWeight) * 100 : 50,
    actual: totalWeight > 0 ? (weightedB / totalWeight) * 100 : 50,
  }

  const compositeScore = {
    candidato: Math.round(compositeRaw.candidato),
    actual: Math.round(compositeRaw.actual),
  }

  let verdict: ComparisonSide | 'tie' = 'tie'
  if (compositeScore.candidato > compositeScore.actual + 2) verdict = 'candidato'
  else if (compositeScore.actual > compositeScore.candidato + 2) verdict = 'actual'

  const compared = winsC + winsA + tied
  let verdictText: string
  if (verdict === 'candidato') {
    verdictText = `El candidato supera a ${actual.name} en ${winsC} de ${compared} métricas (score compuesto ${compositeScore.candidato} vs ${compositeScore.actual})`
  } else if (verdict === 'actual') {
    verdictText = `${actual.name} supera al candidato en ${winsA} de ${compared} métricas (score compuesto ${compositeScore.actual} vs ${compositeScore.candidato})`
  } else {
    verdictText = `Empate técnico: ${winsC}-${winsA} métricas (score compuesto ${compositeScore.candidato} vs ${compositeScore.actual})`
  }

  const categories: ComparisonCategory[] = [...categoryAcc.entries()]
    .filter(([, v]) => v.weight > 0)
    .map(([id, v]) => {
      const candidatoScore = Math.round((v.candidato / v.weight) * 100)
      const actualScore = Math.round((v.actual / v.weight) * 100)
      const diff = Math.abs(candidatoScore - actualScore)
      let winner: ComparisonSide | 'tie' = 'tie'
      if (candidatoScore > actualScore + 2) winner = 'candidato'
      else if (actualScore > candidatoScore + 2) winner = 'actual'
      return {
        id,
        label: CATEGORY_LABELS[id] ?? id,
        candidatoScore,
        actualScore,
        edgeStrength: diff / 100,
        winner,
      }
    })
    .sort((a, b) => b.edgeStrength - a.edgeStrength)

  const radarIds = ['participacion', 'produccion', 'creacion', 'duelos', 'defensa', 'porteria']
  const radar: RadarAxis[] = radarIds
    .map((id) => {
      const cat = categories.find((c) => c.id === id)
      if (!cat) return null
      return {
        axis: cat.label,
        candidato: cat.candidatoScore,
        actual: cat.actualScore,
      }
    })
    .filter((r): r is RadarAxis => r != null)

  if (radar.length < 3) {
    for (const cat of categories) {
      if (radar.some((r) => r.axis === cat.label)) continue
      radar.push({
        axis: cat.label,
        candidato: cat.candidatoScore,
        actual: cat.actualScore,
      })
    }
  }

  return {
    compositeScore,
    metricWins: { candidato: winsC, actual: winsA, tied, total: compared },
    rows,
    categories,
    radar,
    verdict,
    verdictText,
  }
}

export function comparisonSummaryForAI(result: PlayerComparisonResult) {
  return {
    veredicto: result.verdict,
    texto: result.verdictText,
    score_compuesto: result.compositeScore,
    metricas_ganadas: result.metricWins,
    categorias: result.categories.map((c) => ({
      categoria: c.label,
      candidato: c.candidatoScore,
      millonarios: c.actualScore,
      ventaja: c.winner,
    })),
  }
}
