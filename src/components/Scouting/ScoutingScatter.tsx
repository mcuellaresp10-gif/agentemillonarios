import { useMemo, useState } from 'react'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import type { ScoutingPosition, ScatterConfig } from '@/config/positionMetricProfiles'
import type { ScoutingMetricViewId } from '@/config/scoutingMetricViews'
import { resolveScatterConfig } from '@/config/scoutingMetricViews'
import type { ScoutingProfile } from '@/utils/scoutingMetrics'
import { getScatterPoint } from '@/utils/scoutingMetrics'
import { CHART_GOLD } from '@/components/Estadisticas/charts/chartTheme'

const SCATTER_DOT_FILL = CHART_GOLD

export interface ScatterPoint {
  id: number
  name: string
  photo: string
  team: string
  x: number
  y: number
}

interface ScoutingScatterProps {
  profiles: ScoutingProfile[]
  position: ScoutingPosition
  metricView?: ScoutingMetricViewId
  scatterConfig?: ScatterConfig
  highlightIds?: number[]
  selectedId?: number | null
  onSelect?: (id: number) => void
  height?: number
}

function CustomTooltip({
  active,
  payload,
  xLabel,
  yLabel,
}: {
  active?: boolean
  payload?: { payload: ScatterPoint }[]
  xLabel: string
  yLabel: string
}) {
  if (!active || !payload?.[0]) return null
  const p = payload[0].payload
  return (
    <div className="rounded-lg border bg-white p-2 shadow-lg text-xs max-w-[200px]">
      <p className="font-semibold truncate">{p.name}</p>
      <p className="text-slate-500 truncate">{p.team}</p>
      <p className="font-mono mt-1">
        {xLabel}: {p.x.toFixed(2)}
      </p>
      <p className="font-mono">
        {yLabel}: {p.y.toFixed(2)}
      </p>
    </div>
  )
}

export function ScoutingScatter({
  profiles,
  position,
  metricView = 'default',
  scatterConfig: scatterConfigProp,
  highlightIds = [],
  selectedId,
  onSelect,
  height = 360,
}: ScoutingScatterProps) {
  const config = scatterConfigProp ?? resolveScatterConfig(position, metricView)
  const [hoverId, setHoverId] = useState<number | null>(null)

  const points: ScatterPoint[] = useMemo(
    () =>
      profiles
        .filter((p) => p.position === position)
        .map((p) => {
          const pt = getScatterPoint(p, config.x.key, config.y.key, config.color.key)
          return {
            id: pt.id,
            name: pt.name,
            photo: pt.photo,
            team: pt.team,
            x: pt.x,
            y: pt.y,
          }
        }),
    [profiles, position, config],
  )

  const avgX = points.length ? points.reduce((s, p) => s + p.x, 0) / points.length : 0
  const avgY = points.length ? points.reduce((s, p) => s + p.y, 0) / points.length : 0
  const highlightSet = new Set(highlightIds)
  const activeId = selectedId ?? hoverId

  return (
    <div className="space-y-2">
      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 28, right: 16, bottom: 24, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
          <XAxis
            type="number"
            dataKey="x"
            tick={{ fontSize: 10 }}
            label={{ value: config.x.label, position: 'bottom', offset: 0, fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            tick={{ fontSize: 10 }}
            label={{ value: config.y.label, angle: -90, position: 'insideLeft', fontSize: 11 }}
          />
          <ReferenceLine x={avgX} stroke="#94A3B8" strokeDasharray="4 4" />
          <ReferenceLine y={avgY} stroke="#94A3B8" strokeDasharray="4 4" />
          <Tooltip
            content={<CustomTooltip xLabel={config.x.label} yLabel={config.y.label} />}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Scatter
            data={points}
            shape={(props: { cx?: number; cy?: number; payload?: ScatterPoint }) => {
              const { cx = 0, cy = 0, payload } = props
              if (!payload) return <g />
              const isHighlight = highlightSet.has(payload.id) || payload.id === activeId
              return (
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHighlight ? 8 : 5}
                  fill={SCATTER_DOT_FILL}
                  fillOpacity={isHighlight ? 1 : 0.72}
                  stroke={isHighlight ? '#1E3A8A' : '#fff'}
                  strokeWidth={isHighlight ? 2.5 : 1}
                  style={{ cursor: onSelect ? 'pointer' : 'default' }}
                  onClick={() => onSelect?.(payload.id)}
                  onMouseEnter={() => setHoverId(payload.id)}
                  onMouseLeave={() => setHoverId(null)}
                />
              )
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
      <p className="text-xs text-slate-500">
        {points.length} jugadores · prom. X {avgX.toFixed(2)} · prom. Y {avgY.toFixed(2)}
      </p>
    </div>
  )
}

export function ScoutingSelectedCard({
  profile,
  millRefName,
  className,
}: {
  profile: ScoutingProfile | null
  millRefName?: string
  className?: string
}) {
  if (!profile) {
    return (
      <div className={`rounded-xl border p-4 text-sm text-slate-500 ${className ?? ''}`}>
        Selecciona un jugador en el gráfico
      </div>
    )
  }

  return (
    <div className={`rounded-xl border p-4 space-y-3 ${className ?? ''}`}>
      <div className="flex items-center gap-3">
        <img src={profile.photo} alt="" className="h-12 w-12 rounded-full border object-cover" />
        <div className="min-w-0">
          <p className="font-semibold truncate">{profile.name}</p>
          <p className="text-sm text-slate-500 truncate">
            {profile.team}
            {profile.leagueLabel ? ` · ${profile.leagueLabel}` : ''}
          </p>
        </div>
      </div>
      <p className="text-sm font-mono">
        {profile.goals}G · {profile.assists}A · {profile.rating.toFixed(1)} rating ·{' '}
        {profile.minutes}&apos;
      </p>
      {millRefName && (
        <p className="text-xs text-mill-blue">
          Referencia Millonarios: <strong>{millRefName}</strong>
        </p>
      )}
    </div>
  )
}
