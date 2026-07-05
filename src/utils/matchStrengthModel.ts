export interface MatchOutcomeProbs {
  homeWin: number
  draw: number
  awayWin: number
}

export const BASE_DRAW_MAX = 0.14
export const BASE_DRAW_MIN = 0.04
export const ELO_STRENGTH_SCALE = 32
export const DRAW_DECAY_K = 20
const GAP_COMPRESS_THRESHOLD = 12
const GAP_COMPRESS_RATE = 20
const LAMBDA_FLOOR_MISMATCH = 0.05
const LAMBDA_FLOOR_DEFAULT = 0.08

export function winProbFromStrength(strengthA: number, strengthB: number): number {
  const diff = strengthB - strengthA
  return 1 / (1 + Math.pow(10, diff / ELO_STRENGTH_SCALE))
}

export function drawProbFromStrengthGap(gap: number): number {
  const draw = BASE_DRAW_MAX * Math.exp(-Math.abs(gap) / DRAW_DECAY_K)
  return Math.max(BASE_DRAW_MIN, Math.min(BASE_DRAW_MAX, draw))
}

export function outcomeProbsFromStrength(
  strengthA: number,
  strengthB: number,
): MatchOutcomeProbs {
  const draw = drawProbFromStrengthGap(strengthA - strengthB)
  const remaining = 1 - draw
  const shareA = winProbFromStrength(strengthA, strengthB)
  const shareB = 1 - shareA
  return {
    homeWin: remaining * shareA,
    draw,
    awayWin: remaining * shareB,
  }
}

export interface ExpectedGoalsInput {
  strengthA: number
  strengthB: number
  baseTotal: number
  attackModA?: number
  attackModB?: number
  defenseModA?: number
  defenseModB?: number
  strengthGap?: number
}

export function expectedGoalsFromStrength(input: ExpectedGoalsInput): {
  home: number
  away: number
} {
  const {
    strengthA,
    strengthB,
    baseTotal,
    attackModA = 1,
    attackModB = 1,
    defenseModA = 1,
    defenseModB = 1,
    strengthGap,
  } = input

  const shareA = winProbFromStrength(strengthA, strengthB)
  const gap = strengthGap ?? strengthA - strengthB

  let lambdaA = baseTotal * (0.35 + 0.65 * shareA) * attackModA * (1 / defenseModB)
  let lambdaB = baseTotal * (0.35 + 0.65 * (1 - shareA)) * attackModB * (1 / defenseModA)

  if (gap > GAP_COMPRESS_THRESHOLD) {
    lambdaB *= Math.exp(-(gap - GAP_COMPRESS_THRESHOLD) / GAP_COMPRESS_RATE)
    lambdaA *= 1 + Math.min(0.2, (gap - GAP_COMPRESS_THRESHOLD) / 80)
  } else if (gap < -GAP_COMPRESS_THRESHOLD) {
    lambdaA *= Math.exp(-(-gap - GAP_COMPRESS_THRESHOLD) / GAP_COMPRESS_RATE)
    lambdaB *= 1 + Math.min(0.2, (-gap - GAP_COMPRESS_THRESHOLD) / 80)
  }

  const floor = Math.abs(gap) > 18 ? LAMBDA_FLOOR_MISMATCH : LAMBDA_FLOOR_DEFAULT
  return {
    home: Math.max(floor, lambdaA),
    away: Math.max(floor, lambdaB),
  }
}

function poissonPMF(k: number, lambda: number): number {
  if (lambda <= 0) return k === 0 ? 1 : 0
  let logP = -lambda + k * Math.log(lambda)
  for (let i = 2; i <= k; i++) logP -= Math.log(i)
  return Math.exp(logP)
}

export function poissonOutcomeProbs(
  lambdaA: number,
  lambdaB: number,
  maxGoals = 10,
): MatchOutcomeProbs {
  let homeWin = 0
  let draw = 0
  let awayWin = 0

  for (let i = 0; i <= maxGoals; i++) {
    const pi = poissonPMF(i, lambdaA)
    for (let j = 0; j <= maxGoals; j++) {
      const p = pi * poissonPMF(j, lambdaB)
      if (i > j) homeWin += p
      else if (i === j) draw += p
      else awayWin += p
    }
  }

  const sum = homeWin + draw + awayWin || 1
  return { homeWin: homeWin / sum, draw: draw / sum, awayWin: awayWin / sum }
}

function calibrationError(probs: MatchOutcomeProbs, target: MatchOutcomeProbs): number {
  return (
    Math.abs(probs.homeWin - target.homeWin) * 5 +
    Math.abs(probs.draw - target.draw) * 1.5 +
    Math.abs(probs.awayWin - target.awayWin) * 5
  )
}

export function calibrateLambdasTo1X2(
  lambdaA: number,
  lambdaB: number,
  target: MatchOutcomeProbs,
): { home: number; away: number } {
  let bestLa = lambdaA
  let bestLb = lambdaB
  let bestErr = calibrationError(poissonOutcomeProbs(lambdaA, lambdaB), target)

  for (let la = lambdaA * 0.5; la <= lambdaA * 1.6; la += 0.05) {
    for (let lb = lambdaB * 0.35; lb <= lambdaB * 1.6; lb += 0.04) {
      const err = calibrationError(poissonOutcomeProbs(la, lb), target)
      if (err < bestErr) {
        bestErr = err
        bestLa = la
        bestLb = lb
      }
    }
  }

  return {
    home: Math.max(LAMBDA_FLOOR_DEFAULT, bestLa),
    away: Math.max(LAMBDA_FLOOR_DEFAULT, bestLb),
  }
}

export function applyDixonColesAdjustment(
  matrix: number[][],
  lambdaA: number,
  lambdaB: number,
  strengthGap: number,
): number[][] {
  if (Math.abs(strengthGap) > 18) return matrix

  const rho = Math.abs(strengthGap) < 8 ? -0.08 : -0.04 * (1 - Math.abs(strengthGap) / 18)
  const tau = (i: number, j: number): number => {
    if (i === 0 && j === 0) return 1 - lambdaA * lambdaB * rho
    if (i === 0 && j === 1) return 1 + lambdaA * rho
    if (i === 1 && j === 0) return 1 + lambdaB * rho
    if (i === 1 && j === 1) return 1 - rho
    return 1
  }

  const adjusted = matrix.map((row, i) =>
    row.map((p, j) => Math.max(0, p * tau(i, j))),
  )
  const sum = adjusted.flat().reduce((acc, p) => acc + p, 0) || 1
  return adjusted.map((row) => row.map((p) => p / sum))
}
