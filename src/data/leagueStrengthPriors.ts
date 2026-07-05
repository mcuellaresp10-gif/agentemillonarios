/** Fuerza efectiva por equipo (0–100) derivada de tabla Liga BetPlay. */
export const FORM_STRENGTH_WEIGHT = 1
export const FORM_SCALE_K = 0.85
export const BASE_STRENGTH = 50

export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function scaleFormStrength(
  standingPoints: number,
  goalsFor: number,
  goalsAgainst: number,
  played: number,
): number {
  const gd = goalsFor - goalsAgainst
  const ppg = played > 0 ? standingPoints / played : 1
  const formRaw = ppg * 25 + gd * 0.8 + goalsFor * 0.12
  return Math.min(92, Math.max(32, BASE_STRENGTH + formRaw * FORM_SCALE_K))
}

export function getTeamPriorStrength(
  _teamName: string,
  standingPoints: number,
  gamesPlayed: number,
  goalsFor: number,
  goalsAgainst: number,
  isPreSeason: boolean,
): number {
  if (isPreSeason || gamesPlayed === 0) {
    return BASE_STRENGTH
  }
  return scaleFormStrength(standingPoints, goalsFor, goalsAgainst, gamesPlayed)
}

export function getStrengthGap(teamAName: string, teamBName: string, strengthA: number, strengthB: number): number {
  void teamAName
  void teamBName
  return strengthA - strengthB
}
