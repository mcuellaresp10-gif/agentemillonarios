/** Posición normalizada del pool de scouting. */
export type ScoutingPosition = 'G' | 'D' | 'M' | 'F'

export type MetricKey =
  | 'dribblesSuccess90'
  | 'duelsWon90'
  | 'keyPasses90'
  | 'shots90'
  | 'shotsOn90'
  | 'foulsDrawn90'
  | 'tackles90'
  | 'offensiveIndex'
  | 'goals90'
  | 'assists90'
  | 'finishingIndex'
  | 'interceptions90'
  | 'duelWinRate'
  | 'blocks90'
  | 'foulsCommitted90'
  | 'defensiveIndex'
  | 'saves90'
  | 'conceded90'
  | 'savePercentage'
  | 'passes90'
  | 'passAccuracy'
  | 'goalkeeperIndex'
  | 'dribbleSuccessRate'
  | 'dribblesAttempts90'
  | 'shotOnTargetRate'

export interface RadarAxisConfig {
  key: MetricKey
  label: string
  isRate?: boolean
  isComposite?: boolean
  compositeHelp?: string
}

export interface ScatterAxisConfig {
  key: MetricKey
  label: string
  isRate?: boolean
}

export interface ScatterConfig {
  x: ScatterAxisConfig
  y: ScatterAxisConfig
  color: ScatterAxisConfig
  colorLabel: string
}

export interface PositionMetricProfile {
  position: ScoutingPosition
  label: string
  radarAxes: RadarAxisConfig[]
  scatter: ScatterConfig
}

const OFFENSIVE_INDEX_HELP =
  'Promedio normalizado (0–10) de pases clave/90, tiros a puerta/90, regates completados/90 y faltas recibidas/90 vs volantes del pool con ≥90 min.'

const FINISHING_INDEX_HELP =
  'Promedio normalizado (0–10) de goles/90, tiros a puerta/90, regates/90 y pases clave/90 vs delanteros del pool con ≥90 min.'

const DEFENSIVE_INDEX_HELP =
  'Promedio normalizado (0–10) de duelos ganados/90, entradas/90, intercepciones/90 y % duelos vs defensas del pool con ≥90 min.'

const GOALKEEPER_INDEX_HELP =
  'Promedio normalizado (0–10) de paradas/90, % paradas, duelos ganados/90 y precisión de pase vs porteros del pool con ≥90 min.'

export const POSITION_METRIC_PROFILES: Record<ScoutingPosition, PositionMetricProfile> = {
  M: {
    position: 'M',
    label: 'Volante',
    radarAxes: [
      { key: 'dribblesSuccess90', label: 'Regates/90' },
      { key: 'duelsWon90', label: 'Duelos ganados/90' },
      { key: 'keyPasses90', label: 'Pases clave/90' },
      { key: 'shots90', label: 'Remates/90' },
      { key: 'shotsOn90', label: 'Tiros a puerta/90' },
      { key: 'foulsDrawn90', label: 'Faltas recibidas/90' },
      { key: 'tackles90', label: 'Entradas/90' },
      {
        key: 'offensiveIndex',
        label: 'Índice ofensivo',
        isComposite: true,
        compositeHelp: OFFENSIVE_INDEX_HELP,
      },
    ],
    scatter: {
      x: { key: 'keyPasses90', label: 'Pases clave/90' },
      y: { key: 'dribblesSuccess90', label: 'Regates completados/90' },
      color: { key: 'dribbleSuccessRate', label: 'Regates realizados, %' },
      colorLabel: 'Regates realizados, %',
    },
  },
  F: {
    position: 'F',
    label: 'Delantero',
    radarAxes: [
      { key: 'goals90', label: 'Goles/90' },
      { key: 'shots90', label: 'Remates/90' },
      { key: 'shotsOn90', label: 'Tiros a puerta/90' },
      { key: 'dribblesSuccess90', label: 'Regates/90' },
      { key: 'keyPasses90', label: 'Pases clave/90' },
      { key: 'duelsWon90', label: 'Duelos ganados/90' },
      { key: 'assists90', label: 'Asistencias/90' },
      {
        key: 'finishingIndex',
        label: 'Índice finalización',
        isComposite: true,
        compositeHelp: FINISHING_INDEX_HELP,
      },
    ],
    scatter: {
      x: { key: 'goals90', label: 'Goles/90' },
      y: { key: 'shotsOn90', label: 'Tiros a puerta/90' },
      color: { key: 'dribbleSuccessRate', label: 'Regates realizados, %' },
      colorLabel: 'Regates realizados, %',
    },
  },
  D: {
    position: 'D',
    label: 'Defensa',
    radarAxes: [
      { key: 'duelsWon90', label: 'Duelos ganados/90' },
      { key: 'tackles90', label: 'Entradas/90' },
      { key: 'interceptions90', label: 'Intercepciones/90' },
      { key: 'duelWinRate', label: '% duelos ganados', isRate: true },
      { key: 'blocks90', label: 'Bloqueos/90' },
      { key: 'foulsCommitted90', label: 'Faltas/90' },
      { key: 'keyPasses90', label: 'Pases clave/90' },
      {
        key: 'defensiveIndex',
        label: 'Índice defensivo',
        isComposite: true,
        compositeHelp: DEFENSIVE_INDEX_HELP,
      },
    ],
    scatter: {
      x: { key: 'tackles90', label: 'Entradas/90' },
      y: { key: 'duelsWon90', label: 'Duelos ganados/90' },
      color: { key: 'duelWinRate', label: 'Duelos ganados, %' },
      colorLabel: 'Duelos ganados, %',
    },
  },
  G: {
    position: 'G',
    label: 'Portero',
    radarAxes: [
      { key: 'saves90', label: 'Paradas/90' },
      { key: 'conceded90', label: 'Goles enc./90' },
      { key: 'savePercentage', label: '% paradas', isRate: true },
      { key: 'duelsWon90', label: 'Duelos ganados/90' },
      { key: 'passes90', label: 'Pases/90' },
      { key: 'passAccuracy', label: 'Precisión pase', isRate: true },
      { key: 'tackles90', label: 'Salidas/90' },
      {
        key: 'goalkeeperIndex',
        label: 'Índice portero',
        isComposite: true,
        compositeHelp: GOALKEEPER_INDEX_HELP,
      },
    ],
    scatter: {
      x: { key: 'saves90', label: 'Paradas/90' },
      y: { key: 'conceded90', label: 'Goles enc./90' },
      color: { key: 'savePercentage', label: '% paradas' },
      colorLabel: '% paradas',
    },
  },
}

export function getPositionProfile(position: string): PositionMetricProfile {
  const code = position.toUpperCase().charAt(0)
  if (code === 'G' || code === 'D' || code === 'M' || code === 'F') {
    return POSITION_METRIC_PROFILES[code]
  }
  return POSITION_METRIC_PROFILES.M
}

export function scoutingPositionOptions(): { value: ScoutingPosition; label: string }[] {
  return [
    { value: 'M', label: 'Volantes' },
    { value: 'F', label: 'Delanteros' },
    { value: 'D', label: 'Defensas' },
    { value: 'G', label: 'Porteros' },
  ]
}
