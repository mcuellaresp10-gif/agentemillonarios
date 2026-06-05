import type { StandingRow } from '@/types'

export type SimScenario = 'realistic' | 'optimistic' | 'pessimistic' | 'form'

export interface TeamRates {
  winRate: number
  drawRate: number
  loseRate: number
}

export interface SimInput {
  standings: StandingRow[]
  teamId: number
  topN: number
  totalSeasonGames: number
  iterations: number
  scenario: SimScenario
  /** Pre-temporada: todos los equipos parten desde 0 puntos */
  isNewSeason?: boolean
  /**
   * Tasas H2H históricas de Millonarios vs cada rival (opponentId → rates).
   * Cuando se proveen, la simulación de Millonarios itera rival por rival
   * en lugar de usar una tasa global.
   */
  h2hRates?: Record<number, TeamRates>
  /**
   * Tasas H2H de los últimos 5 partidos vs cada rival.
   * Se usan en el escenario "Racha reciente".
   */
  h2hFormRates?: Record<number, TeamRates>
  /** ID del rival del partido extra (clásico vs Santa Fe) */
  extraMatchOpponentId?: number
  /** Tasas de fallback para Millonarios cuando no hay H2H disponible */
  targetHistoricalRates?: TeamRates
}

export interface SimResult {
  probability: number
  positionDistribution: Record<number, number>
  expectedPoints: number
  minPoints: number
  maxPoints: number
  p10Points: number
  p90Points: number
  currentPoints: number
  remainingGames: number
  currentRank: number | null
  totalSeasonGames: number
  isNewSeason: boolean
}

/** Parsea el campo `form` (ej. "WWDLW") en tasas W/D/L */
function parseForm(form: string): TeamRates {
  const chars = [...form]
  if (chars.length === 0) return { winRate: 0.33, drawRate: 0.34, loseRate: 0.33 }
  const wins = chars.filter((c) => c === 'W').length
  const draws = chars.filter((c) => c === 'D').length
  const total = chars.length
  return {
    winRate: wins / total,
    drawRate: draws / total,
    loseRate: (total - wins - draws) / total,
  }
}

const NEUTRAL: TeamRates = { winRate: 0.33, drawRate: 0.34, loseRate: 0.33 }

/**
 * Aplica un multiplicador a la winRate manteniendo W + D + L = 1.
 * El delta se absorbe o libera desde loseRate; drawRate se ajusta
 * para garantizar que la suma sea exactamente 1.
 *
 * Ejemplos con multiplier=1.5 (Optimista):
 *   W=40%, D=28%, L=32% → W=60%, D=28%, L=12%
 *
 * Ejemplos con multiplier=0.5 (Pesimista):
 *   W=40%, D=28%, L=32% → W=20%, D=28%, L=52%
 */
export function applyMultiplier(rates: TeamRates, multiplier: number): TeamRates {
  const newWin = Math.min(0.95, Math.max(0.01, rates.winRate * multiplier))
  const delta = newWin - rates.winRate
  const newLose = Math.max(0.01, rates.loseRate - delta)
  const newDraw = Math.max(0.01, 1 - newWin - newLose)
  // Renormalizar por si hay drift de punto flotante
  const total = newWin + newDraw + newLose
  return {
    winRate: newWin / total,
    drawRate: newDraw / total,
    loseRate: newLose / total,
  }
}

/** Tasas para el resto de equipos (no Millonarios) en cada escenario */
function getOtherTeamRates(row: StandingRow, isNewSeason: boolean): TeamRates {
  if (isNewSeason) {
    if (row.form && row.form.length > 0) return parseForm(row.form)
    return NEUTRAL
  }
  if (row.played === 0) return NEUTRAL
  return {
    winRate: row.win / row.played,
    drawRate: row.draw / row.played,
    loseRate: row.lose / row.played,
  }
}

/**
 * Resuelve las tasas de Millonarios para un partido específico contra `oppId`,
 * aplicando el escenario activo.
 */
function resolveMilloRates(
  oppId: number,
  scenario: SimScenario,
  h2hRates: Record<number, TeamRates> | undefined,
  h2hFormRates: Record<number, TeamRates> | undefined,
  fallback: TeamRates,
): TeamRates {
  const baseRates = h2hRates?.[oppId] ?? fallback

  if (scenario === 'optimistic') return applyMultiplier(baseRates, 1.5)
  if (scenario === 'pessimistic') return applyMultiplier(baseRates, 0.5)
  if (scenario === 'form') return h2hFormRates?.[oppId] ?? baseRates
  // realistic
  return baseRates
}

/**
 * Ejecuta N simulaciones Monte Carlo para estimar la probabilidad de que
 * el equipo `teamId` termine en el top `topN` de la tabla.
 *
 * Cuando `h2hRates` está disponible, la simulación de Millonarios es
 * partido a partido contra cada rival usando su tasa H2H específica.
 * Para el resto de equipos se usan sus tasas generales (racha o neutro).
 */
export function runMonteCarlo(input: SimInput): SimResult {
  const {
    standings,
    teamId,
    topN,
    totalSeasonGames,
    iterations,
    scenario,
    isNewSeason = false,
    h2hRates,
    h2hFormRates,
    extraMatchOpponentId,
    targetHistoricalRates,
  } = input

  const targetRow = standings.find((r) => r.team.id === teamId)
  if (!targetRow || standings.length === 0) {
    return {
      probability: 0,
      positionDistribution: {},
      expectedPoints: 0,
      minPoints: 0,
      maxPoints: 0,
      p10Points: 0,
      p90Points: 0,
      currentPoints: 0,
      remainingGames: totalSeasonGames,
      currentRank: null,
      totalSeasonGames,
      isNewSeason,
    }
  }

  const startPoints = isNewSeason ? 0 : targetRow.points
  const startPlayed = isNewSeason ? 0 : targetRow.played
  const remainingGames = Math.max(0, totalSeasonGames - startPlayed)
  const currentRank = isNewSeason ? null : targetRow.rank
  const fallback = targetHistoricalRates ?? NEUTRAL

  // ── Millonarios: lista de rivales para la simulación H2H ──────────────────
  const useH2H = h2hRates != null && Object.keys(h2hRates).length > 0
  const milloOpponentIds: number[] = standings
    .filter((r) => r.team.id !== teamId)
    .map((r) => r.team.id)
  if (extraMatchOpponentId) milloOpponentIds.push(extraMatchOpponentId)

  // ── Resto de equipos: tasas generales ─────────────────────────────────────
  const otherTeamMeta = standings
    .filter((r) => r.team.id !== teamId)
    .map((row) => ({
      id: row.team.id,
      startPoints: isNewSeason ? 0 : row.points,
      startDiff: isNewSeason ? 0 : row.diff,
      remaining: isNewSeason ? totalSeasonGames : Math.max(0, totalSeasonGames - row.played),
      rates: getOtherTeamRates(row, isNewSeason),
    }))

  // ── Simulaciones ──────────────────────────────────────────────────────────
  let classifyCount = 0
  const positionCounts: Record<number, number> = {}
  const milloPoints: number[] = []

  for (let i = 0; i < iterations; i++) {
    // Simular puntos de Millonarios (partido a partido con tasa H2H por rival)
    let milloPts = startPoints

    if (useH2H) {
      for (const oppId of milloOpponentIds) {
        const rates = resolveMilloRates(oppId, scenario, h2hRates, h2hFormRates, fallback)
        const r = Math.random()
        if (r < rates.winRate) milloPts += 3
        else if (r < rates.winRate + rates.drawRate) milloPts += 1
      }
    } else {
      // Fallback: sin datos H2H, usar tasa global (comportamiento anterior)
      const globalRates =
        scenario === 'optimistic'
          ? applyMultiplier(fallback, 1.5)
          : scenario === 'pessimistic'
            ? applyMultiplier(fallback, 0.5)
            : fallback
      for (let g = 0; g < remainingGames; g++) {
        const r = Math.random()
        if (r < globalRates.winRate) milloPts += 3
        else if (r < globalRates.winRate + globalRates.drawRate) milloPts += 1
      }
    }

    // Simular puntos del resto de equipos
    const finalPoints: Array<{ id: number; pts: number; diff: number }> = [
      { id: teamId, pts: milloPts, diff: isNewSeason ? 0 : targetRow.diff },
      ...otherTeamMeta.map(({ id, startPoints: pts, startDiff, remaining, rates }) => {
        let simPts = pts
        const { winRate, drawRate } = rates
        for (let g = 0; g < remaining; g++) {
          const r = Math.random()
          if (r < winRate) simPts += 3
          else if (r < winRate + drawRate) simPts += 1
        }
        return { id, pts: simPts, diff: startDiff }
      }),
    ]

    // Ordenar tabla: puntos desc, diferencia de goles desc
    finalPoints.sort((a, b) => b.pts - a.pts || b.diff - a.diff)

    const milloPos = finalPoints.findIndex((t) => t.id === teamId) + 1
    milloPoints.push(milloPts)
    positionCounts[milloPos] = (positionCounts[milloPos] ?? 0) + 1
    if (milloPos <= topN) classifyCount++
  }

  milloPoints.sort((a, b) => a - b)
  const expectedPoints = milloPoints.reduce((s, v) => s + v, 0) / iterations

  return {
    probability: classifyCount / iterations,
    positionDistribution: positionCounts,
    expectedPoints: Math.round(expectedPoints * 10) / 10,
    minPoints: milloPoints[0],
    maxPoints: milloPoints[iterations - 1],
    p10Points: milloPoints[Math.floor(iterations * 0.1)],
    p90Points: milloPoints[Math.floor(iterations * 0.9)],
    currentPoints: startPoints,
    remainingGames,
    currentRank,
    totalSeasonGames,
    isNewSeason,
  }
}
