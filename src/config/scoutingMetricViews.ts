import type {
  MetricKey,
  ScatterConfig,
  ScoutingPosition,
} from '@/config/positionMetricProfiles'
import { getPositionProfile } from '@/config/positionMetricProfiles'

export type ScoutingMetricViewId =
  | 'default'
  | 'dribbles'
  | 'passing'
  | 'shooting'
  | 'duels'
  | 'defense'
  | 'attack'

export interface ScoutingMetricView {
  id: ScoutingMetricViewId
  label: string
  description: string
  usePositionDefault?: boolean
  scatter?: ScatterConfig
  positions?: ScoutingPosition[]
  excludePositions?: ScoutingPosition[]
}

const SHARED_VIEWS: ScoutingMetricView[] = [
  {
    id: 'default',
    label: 'Resumen',
    description:
      'Vista principal según la posición: ejes optimizados para volantes, delanteros, defensas o porteros.',
    usePositionDefault: true,
  },
  {
    id: 'dribbles',
    label: 'Regates',
    description: 'Regates completados vs intentados por 90 min.',
    scatter: {
      x: { key: 'dribblesSuccess90', label: 'Regates completados/90' },
      y: { key: 'dribblesAttempts90', label: 'Regates intentados/90' },
      color: { key: 'dribbleSuccessRate', label: '% éxito regate', isRate: true },
      colorLabel: '% éxito regate',
    },
    excludePositions: ['G'],
  },
  {
    id: 'passing',
    label: 'Pases',
    description: 'Pases clave vs volumen total de pases por 90 min.',
    scatter: {
      x: { key: 'keyPasses90', label: 'Pases clave/90' },
      y: { key: 'passes90', label: 'Pases totales/90' },
      color: { key: 'passAccuracy', label: 'Precisión pase', isRate: true },
      colorLabel: 'Precisión de pase',
    },
  },
  {
    id: 'shooting',
    label: 'Disparos',
    description: 'Remates totales vs tiros a puerta por 90 min.',
    scatter: {
      x: { key: 'shots90', label: 'Remates/90' },
      y: { key: 'shotsOn90', label: 'Tiros a puerta/90' },
      color: { key: 'shotOnTargetRate', label: '% tiros a puerta', isRate: true },
      colorLabel: '% tiros a puerta',
    },
    excludePositions: ['G'],
  },
  {
    id: 'duels',
    label: 'Duelos',
    description: 'Duelos ganados por 90 min vs porcentaje de duelos ganados.',
    scatter: {
      x: { key: 'duelsWon90', label: 'Duelos ganados/90' },
      y: { key: 'duelWinRate', label: '% duelos ganados', isRate: true },
      color: { key: 'duelWinRate', label: '% duelos ganados', isRate: true },
      colorLabel: '% duelos ganados',
    },
    excludePositions: ['G'],
  },
  {
    id: 'defense',
    label: 'Defensa',
    description: 'Entradas e intercepciones por 90 min.',
    scatter: {
      x: { key: 'tackles90', label: 'Entradas/90' },
      y: { key: 'interceptions90', label: 'Intercepciones/90' },
      color: { key: 'blocks90', label: 'Bloqueos/90' },
      colorLabel: 'Bloqueos/90',
    },
    positions: ['D', 'M', 'G'],
  },
  {
    id: 'attack',
    label: 'Ataque',
    description: 'Pases clave y regates por 90 min.',
    scatter: {
      x: { key: 'keyPasses90', label: 'Pases clave/90' },
      y: { key: 'dribblesSuccess90', label: 'Regates completados/90' },
      color: { key: 'foulsDrawn90', label: 'Faltas recibidas/90' },
      colorLabel: 'Faltas recibidas/90',
    },
    excludePositions: ['G'],
  },
]

export function getMetricViewsForPosition(position: ScoutingPosition): ScoutingMetricView[] {
  return SHARED_VIEWS.filter((view) => {
    if (view.positions && !view.positions.includes(position)) return false
    if (view.excludePositions?.includes(position)) return false
    return true
  })
}

export function getMetricView(
  viewId: ScoutingMetricViewId,
  position: ScoutingPosition,
): ScoutingMetricView | null {
  return getMetricViewsForPosition(position).find((v) => v.id === viewId) ?? null
}

export function resolveScatterConfig(
  position: ScoutingPosition,
  viewId: ScoutingMetricViewId,
): ScatterConfig {
  const view = getMetricView(viewId, position)
  if (!view || view.usePositionDefault || !view.scatter) {
    return getPositionProfile(position).scatter
  }
  return view.scatter
}

export function metricViewOptions(
  position: ScoutingPosition,
): { value: ScoutingMetricViewId; label: string; description: string }[] {
  return getMetricViewsForPosition(position).map((v) => ({
    value: v.id,
    label: v.label,
    description: v.description,
  }))
}

export function allMetricViewKeys(): MetricKey[] {
  const keys = new Set<MetricKey>()
  for (const view of SHARED_VIEWS) {
    if (!view.scatter) continue
    keys.add(view.scatter.x.key)
    keys.add(view.scatter.y.key)
    keys.add(view.scatter.color.key)
  }
  return [...keys]
}
